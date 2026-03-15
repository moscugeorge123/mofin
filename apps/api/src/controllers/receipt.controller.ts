import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { ReceiptModel } from '../database/models/receipt';
import { catchMongoValidation } from '../helpers/catch-mongo-validation';

export class ReceiptController {
  // Create a new receipt
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { transactionId, price, store, location, date } = req.body;

      const receipt = new ReceiptModel({
        userId,
        transactionId,
        price,
        store,
        location,
        date: date || new Date(),
      });

      await receipt.save();
      await receipt.populate('transactionId');
      res.status(201).json(receipt);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get all receipts for the authenticated user
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { transactionId, store, startDate, endDate } = req.query;

      let query: any = { userId };

      if (transactionId) query.transactionId = transactionId;
      if (store) query.store = { $regex: new RegExp(store as string, 'i') };
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate as string);
        if (endDate) query.date.$lte = new Date(endDate as string);
      }

      const receipts = await ReceiptModel.find(query)
        .populate('transactionId')
        .sort({ date: -1 });

      res.json(receipts);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get receipt by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const receipt = await ReceiptModel.findById(id).populate('transactionId');

      if (!receipt) {
        res.status(404).json({ error: 'Receipt not found' });
        return;
      }

      if (!receipt.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json(receipt);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Update receipt
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const updates = req.body;

      const receipt = await ReceiptModel.findById(id);

      if (!receipt) {
        res.status(404).json({ error: 'Receipt not found' });
        return;
      }

      if (!receipt.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Prevent changing userId
      delete updates.userId;

      Object.assign(receipt, updates);
      await receipt.save();
      await receipt.populate('transactionId');

      res.json(receipt);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Delete receipt
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const receipt = await ReceiptModel.findById(id);

      if (!receipt) {
        res.status(404).json({ error: 'Receipt not found' });
        return;
      }

      if (!receipt.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await ReceiptModel.findByIdAndDelete(id);
      res.json({ message: 'Receipt deleted successfully' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get products for a receipt
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const receipt = await ReceiptModel.findById(id);

      if (!receipt) {
        res.status(404).json({ error: 'Receipt not found' });
        return;
      }

      if (!receipt.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const products = await receipt.getProducts();
      res.json(products);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }
}
