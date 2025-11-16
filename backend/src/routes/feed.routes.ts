import { Router } from 'express';
import { getFeed, getDiscoverFeed, getTrendingPosts } from '../controllers/feed.controller';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Personalized feed (requires auth)
router.get('/', authenticate, getFeed);

// Discover feed (public)
router.get('/discover', optionalAuth, getDiscoverFeed);

// Trending posts
router.get('/trending', getTrendingPosts);

export default router;
