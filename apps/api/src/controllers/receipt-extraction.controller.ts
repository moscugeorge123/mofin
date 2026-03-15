import { Request, Response } from 'express';
import { chatGPTReceiptService } from '../services/chatgpt-receipt.service';

/**
 * Controller for receipt extraction using ChatGPT
 */
export class ReceiptExtractionController {
  /**
   * Extract receipt details from uploaded file
   * POST /api/receipts/extract
   */
  async extractReceipt(req: Request, res: Response) {
    try {
      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded. Please upload a receipt image or PDF.',
        });
        return;
      }

      // Validate file type
      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          success: false,
          message: `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
        });
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.',
        });
        return;
      }

      console.log(
        `📄 Processing receipt: ${req.file.originalname} (${req.file.mimetype})`,
      );

      console.log(req.file);

      // Extract receipt details using ChatGPT
      const receiptData = await chatGPTReceiptService.extractReceiptDetails(
        req.file.path,
      );

      console.log(
        `✅ Receipt extracted successfully: ${receiptData.store} - ${receiptData.products.length} products`,
      );

      // Return the extracted data
      res.status(200).json({
        success: true,
        message: 'Receipt extracted successfully',
        data: receiptData,
      });
      return;
    } catch (error: any) {
      console.error('Error extracting receipt:', error);

      // Check if it's a validation error
      if (
        error.message.includes('Invalid') ||
        error.message.includes('Missing')
      ) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Generic error
      res.status(500).json({
        success: false,
        message: 'Failed to extract receipt details',
        error: error.message,
      });
      return;
    }
  }

  /**
   * Test ChatGPT connection
   * GET /api/receipts/test-connection
   */
  async testConnection(req: Request, res: Response) {
    try {
      const connected = await chatGPTReceiptService.testConnection();

      if (connected) {
        res.status(200).json({
          success: true,
          message: 'Successfully connected to OpenAI API',
        });
        return;
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to connect to OpenAI API',
        });
        return;
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      res.status(500).json({
        success: false,
        message: 'Connection test failed',
        error: error.message,
      });
      return;
    }
  }
}

export const receiptExtractionController = new ReceiptExtractionController();
