import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authMiddleware } from '../middlewares/auth';
import { upload } from '../middlewares/multer';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get transaction totals (credit and debit sums)
router.get('/totals', TransactionController.getTotals);

// Extract transactions from uploaded file (PDF, CSV)
router.post(
  '/extract',
  upload.single('file'),
  TransactionController.extractFromFile,
);

// Get all transaction files (with optional status filter)
router.get('/files', TransactionController.getAllFiles);

// Get totals for a specific transaction file
router.get('/files/:fileId/totals', TransactionController.getFileTotals);

// Rename a transaction file
router.put('/files/:fileId/rename', TransactionController.renameFile);

// Delete a transaction file and its transactions
router.delete('/files/:fileId', TransactionController.deleteFile);

// Get status of a specific transaction file
router.get('/files/:fileId', TransactionController.getFileStatus);

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
