import { Router } from 'express';
import { body } from 'express-validator';
import {
  createPost,
  getPost,
  updatePost,
  deletePost,
  getUserPosts,
  reactToPost,
  removeReaction,
} from '../controllers/post.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Create post
router.post(
  '/',
  authenticate,
  [
    body('type').isIn(['MICRO', 'ARTICLE', 'PROJECT', 'REEL']),
    body('content').trim().notEmpty(),
  ],
  validate,
  createPost
);

// Get post
router.get('/:id', getPost);

// Update post
router.put('/:id', authenticate, updatePost);

// Delete post
router.delete('/:id', authenticate, deletePost);

// Get user posts
router.get('/user/:username', getUserPosts);

// React to post
router.post('/:id/react', authenticate, reactToPost);

// Remove reaction
router.delete('/:id/react', authenticate, removeReaction);

export default router;
