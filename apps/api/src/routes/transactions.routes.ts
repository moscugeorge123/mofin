import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authMiddleware } from '../middlewares/auth';
import { upload } from '../middlewares/multer';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Extract transactions from uploaded file (PDF, CSV)
router.post(
  '/extract',
  upload.single('file'),
  TransactionController.extractFromFile,
);

// Get account balance
router.get(
  '/account/:accountId/balance',
  TransactionController.getAccountBalance,
);

// Create a new transaction
router.post('/', TransactionController.create);

// Get all transactions
router.get('/', TransactionController.getAll);

// Get transaction by ID
router.get('/:id', TransactionController.getById);

// Update transaction
router.put('/:id', TransactionController.update);

// Delete transaction
router.delete('/:id', TransactionController.delete);

// Add tag to transaction
router.post('/:id/tags', TransactionController.addTag);

// Remove tag from transaction
router.delete('/:id/tags', TransactionController.removeTag);

export default router;
