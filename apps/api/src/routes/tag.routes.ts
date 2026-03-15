import { Router } from 'express';
import { TagController } from '../controllers/tag.controller';

const router = Router();

// Get popular tags
router.get('/popular', TagController.getPopular);

// Get tag by slug
router.get('/slug/:slug', TagController.getBySlug);

// Create tag from name
router.post('/from-name', TagController.createFromName);

// Create a new tag
router.post('/', TagController.create);

// Get all tags
router.get('/', TagController.getAll);

// Get tag by ID
router.get('/:id', TagController.getById);

// Update tag
router.put('/:id', TagController.update);

// Delete tag
router.delete('/:id', TagController.delete);

// Get transactions for a tag
router.get('/:id/transactions', TagController.getTransactions);

// Update usage count
router.post('/:id/update-count', TagController.updateCount);

export default router;
