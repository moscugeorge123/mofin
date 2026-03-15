import express from 'express';
import { receiptExtractionController } from '../controllers/receipt-extraction.controller';
import { authMiddleware } from '../middlewares/auth';
import { upload } from '../middlewares/multer';

const router = express.Router();

/**
 * Receipt Extraction Routes
 * All routes require authentication
 */

/**
 * @route   POST /api/receipt-extraction/extract
 * @desc    Extract receipt details from uploaded image/PDF using ChatGPT
 * @access  Private
 * @body    file: image/pdf file (multipart/form-data)
 */
router.post(
  '/extract',
  authMiddleware,
  upload.single('receipt'),
  receiptExtractionController.extractReceipt,
);

/**
 * @route   GET /api/receipt-extraction/test-connection
 * @desc    Test connection to OpenAI API
 * @access  Private
 */
router.get(
  '/test-connection',
  authMiddleware,
  receiptExtractionController.testConnection,
);

export default router;
