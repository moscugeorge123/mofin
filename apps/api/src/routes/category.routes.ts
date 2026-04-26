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

// Get totals for transactions matching category rules
router.get(
  '/:id/transactions/by-rules/totals',
  CategoryController.getTransactionsByRulesTotals,
);

// Get transactions for a category
router.get('/:id/transactions', CategoryController.getTransactions);

// Apply category to a transaction
router.post('/:id/apply', CategoryController.applyToTransaction);

// Add a transaction manually to a group
router.post(
  '/:id/transactions/:transactionId',
  CategoryController.addTransaction,
);

// Remove a manually added transaction from a group
router.delete(
  '/:id/transactions/:transactionId',
  CategoryController.removeTransaction,
);

// Update transaction count
router.post('/:id/update-count', CategoryController.updateCount);

export default router;
