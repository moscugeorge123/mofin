import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();

// Create a new product
router.post('/', ProductController.create);

// Get all products
router.get('/', ProductController.getAll);

// Get product by ID
router.get('/:id', ProductController.getById);

// Update product
router.put('/:id', ProductController.update);

// Delete product
router.delete('/:id', ProductController.delete);

// Get purchase history for a product
router.get('/:id/purchase-history', ProductController.getPurchaseHistory);

// Get average price for a product
router.get('/:id/average-price', ProductController.getAveragePrice);

export default router;
