import { Router } from 'express';
import { ReceiptProductController } from '../controllers/receipt-product.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new receipt product
router.post('/', ReceiptProductController.create);

// Get all receipt products
router.get('/', ReceiptProductController.getAll);

// Get receipt product by ID
router.get('/:id', ReceiptProductController.getById);

// Update receipt product
router.put('/:id', ReceiptProductController.update);

// Delete receipt product
router.delete('/:id', ReceiptProductController.delete);

export default router;
