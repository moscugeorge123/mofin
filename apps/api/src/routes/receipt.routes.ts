import { Router } from 'express';
import { ReceiptController } from '../controllers/receipt.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new receipt
router.post('/', ReceiptController.create);

// Get all receipts
router.get('/', ReceiptController.getAll);

// Get receipt by ID
router.get('/:id', ReceiptController.getById);

// Update receipt
router.put('/:id', ReceiptController.update);

// Delete receipt
router.delete('/:id', ReceiptController.delete);

// Get products for a receipt
router.get('/:id/products', ReceiptController.getProducts);

export default router;
