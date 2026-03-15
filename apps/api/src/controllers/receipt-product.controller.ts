import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ReceiptModel } from '../database/models/receipt';
import { ReceiptProductModel } from '../database/models/receipt-product';
import { catchMongoValidation } from '../helpers/catch-mongo-validation';

export class ReceiptProductController {
  // Create a new receipt product
  static async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const {
        productId,
        receiptId,
        name,
        price,
        quantity,
        quantityType,
        discount,
      } = req.body;

      // Verify receipt belongs to user
      const receipt = await ReceiptModel.findById(receiptId);
      if (
        !receipt ||
        !receipt.userId.equals(new mongoose.Types.ObjectId(userId))
      ) {
        res.status(403).json({ error: 'Access denied to this receipt' });
        return;
      }

      const receiptProduct = new ReceiptProductModel({
        userId,
        productId,
        receiptId,
        name,
        price,
        quantity,
        quantityType,
        discount: discount || 0,
      });

      await receiptProduct.save();
      await receiptProduct.populate(['productId', 'receiptId']);
      res.status(201).json(receiptProduct);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get all receipt products for the authenticated user
  static async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { receiptId, productId } = req.query;

      let query: any = { userId };

      if (receiptId) query.receiptId = receiptId;
      if (productId) query.productId = productId;

      const receiptProducts = await ReceiptProductModel.find(query)
        .populate(['productId', 'receiptId'])
        .sort({ createdAt: -1 });

      res.json(receiptProducts);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get receipt product by ID
  static async getById(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const receiptProduct = await ReceiptProductModel.findById(id).populate([
        'productId',
        'receiptId',
      ]);

      if (!receiptProduct) {
        res.status(404).json({ error: 'Receipt product not found' });
        return;
      }

      if (!receiptProduct.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json(receiptProduct);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Update receipt product
  static async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const updates = req.body;

      const receiptProduct = await ReceiptProductModel.findById(id);

      if (!receiptProduct) {
        res.status(404).json({ error: 'Receipt product not found' });
        return;
      }

      if (!receiptProduct.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Prevent changing userId, productId, and receiptId
      delete updates.userId;
      delete updates.productId;
      delete updates.receiptId;

      Object.assign(receiptProduct, updates);
      await receiptProduct.save();
      await receiptProduct.populate(['productId', 'receiptId']);

      res.json(receiptProduct);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Delete receipt product
  static async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const receiptProduct = await ReceiptProductModel.findById(id);

      if (!receiptProduct) {
        res.status(404).json({ error: 'Receipt product not found' });
        return;
      }

      if (!receiptProduct.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await ReceiptProductModel.findByIdAndDelete(id);
      res.json({ message: 'Receipt product deleted successfully' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }
}
