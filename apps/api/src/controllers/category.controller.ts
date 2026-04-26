import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { CategoryModel } from '../database/models/category';
import { catchMongoValidation } from '../helpers/catch-mongo-validation';

export class CategoryController {
  // Create a new category
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { name, description, rules, color, icon } = req.body;

      const category = new CategoryModel({
        userId,
        name,
        description,
        rules: rules || [],
        color,
        icon,
      });

      await category.save();
      res.status(201).json(category);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get all categories for the authenticated user
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const categories = await CategoryModel.findByUser(
        new mongoose.Types.ObjectId(userId),
      );
      res.json(categories);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get category by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const category = await CategoryModel.findById(id);

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      if (!category.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json(category);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Update category
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const updates = req.body;

      const category = await CategoryModel.findById(id);

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      if (!category.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Prevent changing userId
      delete updates.userId;

      Object.assign(category, updates);
      await category.save();

      res.json(category);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Delete category
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const category = await CategoryModel.findById(id);

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      if (!category.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await CategoryModel.findByIdAndDelete(id);
      res.json({ message: 'Category deleted successfully' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get transactions for a category
  static async getTransactions(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const category = await CategoryModel.findById(id);

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      if (!category.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const transactions = await category.getTransactions();
      res.json(transactions);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Apply category to a transaction
  static async applyToTransaction(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { transactionId } = req.body;

      const category = await CategoryModel.findById(id);

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      if (!category.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await category.applyToTransaction(
        new mongoose.Types.ObjectId(transactionId),
      );
      res.json({ message: 'Category applied successfully' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Update transaction count
  static async updateCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const category = await CategoryModel.findById(id);

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      if (!category.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const count = await category.updateTransactionCount();
      res.json({ transactionCount: count });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Add a transaction manually to a group
  static async addTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id, transactionId } = req.params;

      const category = await CategoryModel.findById(id);

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      if (!category.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const txnObjectId = new mongoose.Types.ObjectId(transactionId as string);

      const alreadyAdded = category.manualTransactionIds.some((t) =>
        t.equals(txnObjectId),
      );

      if (!alreadyAdded) {
        category.manualTransactionIds.push(txnObjectId);
        await category.save();
      }

      res.json({ message: 'Transaction added to group successfully' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Remove a manually added transaction from a group
  static async removeTransaction(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user.id;
      const { id, transactionId } = req.params;

      const category = await CategoryModel.findById(id);

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      if (!category.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const txnObjectId = new mongoose.Types.ObjectId(transactionId as string);

      // Remove from manual list (if it was manually added)
      category.manualTransactionIds = category.manualTransactionIds.filter(
        (t) => !t.equals(txnObjectId),
      );

      // Add to exclusion list (prevents rule-matched transactions from appearing)
      const alreadyExcluded = (category.excludedTransactionIds || []).some(
        (t) => t.equals(txnObjectId),
      );
      if (!alreadyExcluded) {
        (category.excludedTransactionIds as mongoose.Types.ObjectId[]).push(
          txnObjectId,
        );
      }

      await category.save();

      res.json({ message: 'Transaction removed from group successfully' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get transactions that match category rules (with pagination and filters)
  static async getTransactionsByRules(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const {
        accountId,
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

      const category = await CategoryModel.findById(id);

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      if (!category.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const BankAccountModel = mongoose.model('BankAccount');
      const TransactionModel = mongoose.model('Transaction');

      // Get all accounts the user has access to
      const accessibleAccounts = await BankAccountModel.find({
        $or: [
          { owner: new mongoose.Types.ObjectId(userId) },
          { sharedWith: new mongoose.Types.ObjectId(userId) },
        ],
      });
      const accessibleAccountIds = accessibleAccounts.map(
        (acc: any) => acc._id,
      );

      // Build base query
      let query: any = { accountId: { $in: accessibleAccountIds } };

      if (accountId) query.accountId = accountId;
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

      // Get ALL matching transactions first (we need to filter by rules in memory)
      const allTransactions = await TransactionModel.find(query)
        .populate(['accountId', 'category', 'tags'])
        .sort({ date: -1 });

      // Filter transactions by category rules
      const excludedIds = new Set(
        (category.excludedTransactionIds || []).map((id) => id.toString()),
      );

      const ruleMatched = allTransactions.filter(
        (transaction) =>
          category.matchesTransaction(transaction) &&
          !excludedIds.has(transaction._id.toString()),
      );

      // Also fetch manually added transactions not already in the rule-matched set
      const ruleMatchedIds = new Set(
        ruleMatched.map((t: any) => t._id.toString()),
      );
      const manualIds = (category.manualTransactionIds || []).map((id) =>
        id.toString(),
      );
      const missingManualIds = manualIds.filter(
        (id) => !ruleMatchedIds.has(id) && !excludedIds.has(id),
      );

      let manualTransactions: any[] = [];
      if (missingManualIds.length > 0) {
        manualTransactions = await TransactionModel.find({
          _id: { $in: missingManualIds },
        })
          .populate(['accountId', 'category', 'tags'])
          .sort({ date: -1 });
      }

      // Merge: rule-matched first, then manual-only additions
      const matchingTransactions = [...ruleMatched, ...manualTransactions];

      // Apply pagination after filtering
      const pageNumber = parseInt(page as string) || 1;
      const pageSize = parseInt(limit as string) || 50;
      const skip = (pageNumber - 1) * pageSize;
      const totalCount = matchingTransactions.length;

      const paginatedTransactions = matchingTransactions.slice(
        skip,
        skip + pageSize,
      );

      res.json({
        data: paginatedTransactions,
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

  // Get totals (credit/debit/byCurrency) for transactions matching category rules
  static async getTransactionsByRulesTotals(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const {
        accountId,
        startDate,
        endDate,
        status,
        search,
        creditDebitIndicator,
        minAmount,
        maxAmount,
      } = req.query;

      const category = await CategoryModel.findById(id);

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      if (!category.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const BankAccountModel = mongoose.model('BankAccount');
      const TransactionModel = mongoose.model('Transaction');

      const accessibleAccounts = await BankAccountModel.find({
        $or: [
          { owner: new mongoose.Types.ObjectId(userId) },
          { sharedWith: new mongoose.Types.ObjectId(userId) },
        ],
      });
      const accessibleAccountIds = accessibleAccounts.map(
        (acc: any) => acc._id,
      );

      let query: any = { accountId: { $in: accessibleAccountIds } };

      if (accountId) query.accountId = accountId;
      if (status) query.status = status;
      if (creditDebitIndicator)
        query.creditDebitIndicator = creditDebitIndicator;

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate as string);
        if (endDate) query.date.$lte = new Date(endDate as string);
      }

      if (search) {
        query.$or = [
          { store: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
        ];
      }

      if (minAmount || maxAmount) {
        query['amount.sum'] = {};
        if (minAmount)
          query['amount.sum'].$gte = parseFloat(minAmount as string);
        if (maxAmount)
          query['amount.sum'].$lte = parseFloat(maxAmount as string);
      }

      const allTransactions = await TransactionModel.find(query).sort({
        date: -1,
      });

      const ruleMatched = allTransactions.filter((transaction) =>
        category.matchesTransaction(transaction),
      );

      const excludedIdsForTotals = new Set(
        (category.excludedTransactionIds || []).map((id) => id.toString()),
      );

      const ruleMatchedFiltered = ruleMatched.filter(
        (t: any) => !excludedIdsForTotals.has(t._id.toString()),
      );

      const ruleMatchedIds = new Set(
        ruleMatchedFiltered.map((t: any) => t._id.toString()),
      );
      const manualIds = (category.manualTransactionIds || []).map((id) =>
        id.toString(),
      );
      const missingManualIds = manualIds.filter(
        (id) => !ruleMatchedIds.has(id) && !excludedIdsForTotals.has(id),
      );

      let manualTransactions: any[] = [];
      if (missingManualIds.length > 0) {
        manualTransactions = await TransactionModel.find({
          _id: { $in: missingManualIds },
        }).sort({ date: -1 });
      }

      const matchingTransactions = [
        ...ruleMatchedFiltered,
        ...manualTransactions,
      ];

      // Compute totals
      let credit = 0;
      let debit = 0;
      const byCurrency: Record<string, { credit: number; debit: number }> = {};

      const { getCurrencyRates } =
        await import('../services/currency-rates.service');
      const currencyRates = getCurrencyRates();

      for (const t of matchingTransactions) {
        const amount: number = t.amount?.sum ?? 0;
        const currency: string = t.amount?.currency ?? 'RON';
        const isCredit = t.creditDebitIndicator === 'Credit';

        if (!byCurrency[currency])
          byCurrency[currency] = { credit: 0, debit: 0 };

        if (isCredit) {
          byCurrency[currency].credit += amount;
        } else {
          byCurrency[currency].debit += amount;
        }

        // Convert to RON
        let amountInRON = amount;
        if (currency !== 'RON' && currencyRates) {
          const rateKey = `${currency}_RON` as keyof typeof currencyRates;
          const rate = currencyRates[rateKey];
          if (typeof rate === 'number') {
            amountInRON = amount * rate;
          }
        }

        if (isCredit) {
          credit += amountInRON;
        } else {
          debit += amountInRON;
        }
      }

      res.json({
        credit,
        debit,
        balance: credit - debit,
        byCurrency,
      });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }
}
