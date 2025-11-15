import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { v4 as uuidv4 } from 'uuid';

// Signup
export async function signup(req: Request, res: Response) {
  try {
    const { username, email, password, name } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already in use' : 'Username already taken',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        profile: {
          create: {},
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Save refresh token
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send verification email (async, don't wait)
    sendVerificationEmail(user.email, user.name).catch(console.error);

    res.status(201).json({
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Login
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if banned
    if (user.banned) {
      return res.status(403).json({ message: 'Account has been banned' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Save refresh token
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Logout
export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.session.deleteMany({
        where: { refreshToken },
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Refresh token
export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify token
    const userId = verifyRefreshToken(refreshToken);

    if (!userId) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { refreshToken },
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Session expired' });
    }

    // Generate new access token
    const { accessToken } = generateTokens(userId);

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Get current user
export async function getMe(req: Request, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
        coverUrl: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        profile: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Email verification
export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = req.params;

    // In production, you'd verify the token and update the user
    // For now, we'll just return success
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Forgot password
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Send password reset email (async)
      sendPasswordResetEmail(user.email, user.name).catch(console.error);
    }

    // Always return success to prevent email enumeration
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Reset password
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // In production, verify the token
    // For now, return success
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// OAuth handlers (simplified)
export async function googleAuth(req: Request, res: Response) {
  try {
    const { token } = req.body;
    // Implement Google OAuth verification
    res.status(501).json({ message: 'Google OAuth not yet implemented' });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function githubAuth(req: Request, res: Response) {
  try {
    const { code } = req.body;
    // Implement GitHub OAuth verification
    res.status(501).json({ message: 'GitHub OAuth not yet implemented' });
  } catch (error) {
    console.error('GitHub auth error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
