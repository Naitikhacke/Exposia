import { Request, Response } from 'express';
import { prisma } from '../index';
import { PostType, ReactionType } from '@prisma/client';
import { io } from '../index';

// Create post
export async function createPost(req: Request, res: Response) {
  try {
    const { type, title, content, metadata, mediaIds, topicIds } = req.body;
    const userId = req.userId!;

    const post = await prisma.post.create({
      data: {
        authorId: userId,
        type: type as PostType,
        title,
        content,
        metadata: metadata || {},
        media: mediaIds
          ? {
              connect: mediaIds.map((id: string) => ({ id })),
            }
          : undefined,
        topics: topicIds
          ? {
              create: topicIds.map((topicId: string) => ({ topicId })),
            }
          : undefined,
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
        media: true,
        topics: {
          include: {
            topic: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    });

    // Notify followers (emit socket event)
    io.to(`user:${userId}`).emit('post:created', post);

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get post
export async function getPost(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        media: true,
        topics: {
          include: {
            topic: true,
          },
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment view count
    await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Update post
export async function updatePost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, content, metadata } = req.body;
    const userId = req.userId!;

    // Check ownership
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        metadata,
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
        media: true,
        topics: {
          include: {
            topic: true,
          },
        },
      },
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Delete post
export async function deletePost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await prisma.post.delete({
      where: { id },
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get user posts
export async function getUserPosts(req: Request, res: Response) {
  try {
    const { username } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await prisma.post.findMany({
      where: { authorId: user.id, published: true },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        media: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    });

    const total = await prisma.post.count({
      where: { authorId: user.id, published: true },
    });

    res.json({
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// React to post
export async function reactToPost(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const userId = req.userId!;

    // Check if already reacted
    const existing = await prisma.reaction.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId,
        },
      },
    });

    if (existing) {
      // Update reaction type
      const reaction = await prisma.reaction.update({
        where: {
          postId_userId: {
            postId: id,
            userId,
          },
        },
        data: { type: type as ReactionType },
      });

      return res.json(reaction);
    }

    // Create new reaction
    const reaction = await prisma.reaction.create({
      data: {
        postId: id,
        userId,
        type: type as ReactionType,
      },
    });

    // Create notification for post author
    const post = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (post && post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: 'REACTION',
          payload: {
            postId: id,
            userId,
            reactionType: type,
          },
        },
      });

      // Emit socket event
      io.to(`user:${post.authorId}`).emit('notification:new', {
        type: 'REACTION',
        postId: id,
      });
    }

    res.json(reaction);
  } catch (error) {
    console.error('React to post error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Remove reaction
export async function removeReaction(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    await prisma.reaction.delete({
      where: {
        postId_userId: {
          postId: id,
          userId,
        },
      },
    });

    res.json({ message: 'Reaction removed' });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
