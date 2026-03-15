import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { BankAccountModel } from '../database/models/bank-account';
import { TransactionModel } from '../database/models/transaction';
import { catchMongoValidation } from '../helpers/catch-mongo-validation';

export class TransactionController {
  // Create a new transaction
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const {
        bankTransactionId,
        accountId,
        amount,
        notes,
        state,
        relationBankAccount,
        tags,
        category,
        location,
        store,
        creditDebitIndicator,
        status,
        date,
      } = req.body;

      // Verify user has access to the account
      const account = await BankAccountModel.findById(accountId);
      if (!account || !account.hasAccess(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied to this account' });
        return;
      }

      const transaction = new TransactionModel({
        userId,
        bankTransactionId,
        accountId,
        amount,
        notes,
        state,
        relationBankAccount,
        tags: tags || [],
        category,
        location,
        store,
        creditDebitIndicator,
        status: status || 'Booked',
        date: date || new Date(),
      });

      await transaction.save();
      await transaction.populate(['accountId', 'category', 'tags']);
      res.status(201).json(transaction);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get all transactions for the authenticated user
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { accountId, category, startDate, endDate, status } = req.query;

      let query: any = { userId };

      if (accountId) query.accountId = accountId;
      if (category) query.category = category;
      if (status) query.status = status;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate as string);
        if (endDate) query.date.$lte = new Date(endDate as string);
      }

      const transactions = await TransactionModel.find(query)
        .populate(['accountId', 'category', 'tags'])
        .sort({ date: -1 });

      res.json(transactions);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get transaction by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const transaction = await TransactionModel.findById(id).populate([
        'accountId',
        'category',
        'tags',
        'relationBankAccount',
      ]);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      if (!transaction.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json(transaction);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Update transaction
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const updates = req.body;

      const transaction = await TransactionModel.findById(id);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      if (!transaction.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Prevent changing userId and accountId
      delete updates.userId;
      delete updates.accountId;

      Object.assign(transaction, updates);
      await transaction.save();
      await transaction.populate(['accountId', 'category', 'tags']);

      res.json(transaction);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Delete transaction
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const transaction = await TransactionModel.findById(id);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      if (!transaction.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await TransactionModel.findByIdAndDelete(id);
      res.json({ message: 'Transaction deleted successfully' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Add tag to transaction
  static async addTag(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { tagId } = req.body;

      const transaction = await TransactionModel.findById(id);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      if (!transaction.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await transaction.addTag(new mongoose.Types.ObjectId(tagId));
      await transaction.populate(['accountId', 'category', 'tags']);

      res.json(transaction);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Remove tag from transaction
  static async removeTag(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { tagId } = req.body;

      const transaction = await TransactionModel.findById(id);

      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      if (!transaction.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await transaction.removeTag(new mongoose.Types.ObjectId(tagId));
      await transaction.populate(['accountId', 'category', 'tags']);

      res.json(transaction);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get account balance
  static async getAccountBalance(
    req: Request<{ accountId: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user.id;
      const { accountId } = req.params;

      // Verify user has access to the account
      const account = await BankAccountModel.findById(accountId);
      if (!account || !account.hasAccess(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied to this account' });
        return;
      }

      const total = await TransactionModel.getTotalByAccount(
        new mongoose.Types.ObjectId(accountId),
      );

      res.json({ accountId, balance: total });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }
}
