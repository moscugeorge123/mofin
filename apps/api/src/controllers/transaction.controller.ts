import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { BankAccountModel } from '../database/models/bank-account';
import { TransactionModel } from '../database/models/transaction';
import { TransactionFileModel } from '../database/models/transaction-file';
import { catchMongoValidation } from '../helpers/catch-mongo-validation';
import { ChatGPTTransactionService } from '../services/chatgpt-transaction.service';

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
      const {
        accountId,
        category,
        startDate,
        endDate,
        status,
        search,
        creditDebitIndicator,
        minAmount,
        maxAmount,
        page,
        limit,
      } = req.query;

      let query: any = { userId };

      if (accountId) query.accountId = accountId;
      if (category) query.category = category;
      if (status) query.status = status;
      if (creditDebitIndicator)
        query.creditDebitIndicator = creditDebitIndicator;

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate as string);
        if (endDate) query.date.$lte = new Date(endDate as string);
      }

      // Search in store and notes fields
      if (search) {
        query.$or = [
          { store: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
        ];
      }

      // Filter by amount range
      if (minAmount || maxAmount) {
        query['amount.sum'] = {};
        if (minAmount)
          query['amount.sum'].$gte = parseFloat(minAmount as string);
        if (maxAmount)
          query['amount.sum'].$lte = parseFloat(maxAmount as string);
      }

      // Pagination
      const pageNumber = parseInt(page as string) || 1;
      const pageSize = parseInt(limit as string) || 50;
      const skip = (pageNumber - 1) * pageSize;

      // Get total count for pagination
      const totalCount = await TransactionModel.countDocuments(query);

      const transactions = await TransactionModel.find(query)
        .populate(['accountId', 'category', 'tags'])
        .sort({ date: -1 })
        .skip(skip)
        .limit(pageSize);

      res.json({
        data: transactions,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      });
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

  // Extract transactions from uploaded file (PDF, CSV)
  static async extractFromFile(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user.id;
      const { accountId } = req.body;

      // Check if file was uploaded
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Verify account access
      const account = await BankAccountModel.findById(accountId);
      if (!account || !account.hasAccess(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied to this account' });
        return;
      }

      // Validate file type
      const allowedMimeTypes = [
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
      ];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          error: 'Invalid file type. Only PDF and CSV files are supported.',
        });
        return;
      }

      // Create transaction file record
      const transactionFile = new TransactionFileModel({
        userId: new mongoose.Types.ObjectId(userId),
        filePath: req.file.path,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        status: 'pending',
      });

      await transactionFile.save();

      try {
        // Mark as processing
        await transactionFile.markAsProcessing();

        // Extract transactions using ChatGPT
        const chatGPTService = new ChatGPTTransactionService();
        const extractedData = await chatGPTService.extractTransactions(
          req.file.path,
          req.file.mimetype,
        );

        // Save extracted data
        transactionFile.extractedData = extractedData;
        await transactionFile.save();

        // Insert transactions into database
        const insertedTransactions = [];
        const transactionIds: mongoose.Types.ObjectId[] = [];

        for (const txData of extractedData.transactions) {
          const transaction = new TransactionModel({
            userId: new mongoose.Types.ObjectId(userId),
            accountId: new mongoose.Types.ObjectId(accountId),
            amount: {
              sum: txData.amount.sum,
              currency: txData.amount.currency,
            },
            notes: txData.notes || '',
            state: txData.state,
            location: txData.location,
            store: txData.store,
            creditDebitIndicator: txData.creditDebitIndicator,
            status: txData.status || 'Booked',
            date: new Date(txData.date),
            tags: [],
          });

          await transaction.save();
          await transaction.populate(['accountId', 'category', 'tags']);

          insertedTransactions.push(transaction);
          transactionIds.push(transaction._id as mongoose.Types.ObjectId);
        }

        // Mark file as completed
        await transactionFile.markAsCompleted(transactionIds);

        res.status(201).json({
          message: 'Transactions extracted and saved successfully',
          file: {
            id: transactionFile._id,
            originalName: transactionFile.originalName,
            status: transactionFile.status,
          },
          transactions: insertedTransactions,
          count: insertedTransactions.length,
        });
      } catch (error: any) {
        // Mark file as failed
        await transactionFile.markAsFailed(error.message);
        throw error;
      }
    } catch (error: any) {
      console.error('Error extracting transactions from file:', error);
      res.status(500).json({
        error: 'Failed to extract transactions from file',
        details: error.message,
      });
    }
  }
}
