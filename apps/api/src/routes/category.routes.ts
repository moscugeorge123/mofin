import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new category
router.post('/', CategoryController.create);

// Get all categories
router.get('/', CategoryController.getAll);

// Get category by ID
router.get('/:id', CategoryController.getById);

// Update category
router.put('/:id', CategoryController.update);

// Delete category
router.delete('/:id', CategoryController.delete);

// Get transactions that match category rules (place before /:id/transactions)
router.get(
  '/:id/transactions/by-rules',
  CategoryController.getTransactionsByRules,
);

// Get transactions for a category
router.get('/:id/transactions', CategoryController.getTransactions);

// Apply category to a transaction
router.post('/:id/apply', CategoryController.applyToTransaction);

// Update transaction count
router.post('/:id/update-count', CategoryController.updateCount);

export default router;
