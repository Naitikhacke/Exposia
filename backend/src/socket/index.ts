import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

interface AuthSocket extends Socket {
  userId?: string;
}

export function initializeSocketHandlers(io: Server) {
  // Authentication middleware
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
        userId: string;
      };

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Handle typing indicators
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        userId: socket.userId,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        userId: socket.userId,
      });
    });

    // Handle real-time comments
    socket.on('comment:create', async (data) => {
      try {
        const { postId, content, parentId } = data;

        const comment = await prisma.comment.create({
          data: {
            postId,
            authorId: socket.userId!,
            content,
            parentId,
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        });

        // Emit to all users viewing this post
        io.to(`post:${postId}`).emit('comment:new', comment);

        // Notify post author
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { authorId: true },
        });

        if (post && post.authorId !== socket.userId) {
          io.to(`user:${post.authorId}`).emit('notification:new', {
            type: 'COMMENT',
            postId,
            comment,
          });
        }
      } catch (error) {
        console.error('Comment creation error:', error);
        socket.emit('error', { message: 'Failed to create comment' });
      }
    });

    // Join post room for real-time updates
    socket.on('post:join', ({ postId }) => {
      socket.join(`post:${postId}`);
    });

    socket.on('post:leave', ({ postId }) => {
      socket.leave(`post:${postId}`);
    });

    // Handle messages
    socket.on('message:send', async (data) => {
      try {
        const { receiverId, content } = data;

        const message = await prisma.message.create({
          data: {
            senderId: socket.userId!,
            receiverId,
            content,
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        });

        // Send to receiver
        io.to(`user:${receiverId}`).emit('message:new', message);

        // Confirm to sender
        socket.emit('message:sent', message);

        // Create notification
        await prisma.notification.create({
          data: {
            userId: receiverId,
            type: 'MESSAGE',
            payload: {
              messageId: message.id,
              senderId: socket.userId,
            },
          },
        });
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark message as read
    socket.on('message:read', async ({ messageId }) => {
      try {
        await prisma.message.update({
          where: { id: messageId },
          data: { readAt: new Date() },
        });

        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { senderId: true },
        });

        if (message) {
          io.to(`user:${message.senderId}`).emit('message:read', { messageId });
        }
      } catch (error) {
        console.error('Mark message read error:', error);
      }
    });

    // Presence updates
    socket.on('presence:update', ({ status }) => {
      socket.broadcast.emit('presence:change', {
        userId: socket.userId,
        status,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      socket.broadcast.emit('presence:change', {
        userId: socket.userId,
        status: 'offline',
      });
    });
  });
}
