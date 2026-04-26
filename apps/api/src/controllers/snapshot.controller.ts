import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { CategoryModel } from '../database/models/category';
import { SnapshotModel } from '../database/models/snapshot';
import { catchMongoValidation } from '../helpers/catch-mongo-validation';
import { getCurrencyRates } from '../services/currency-rates.service';

export class SnapshotController {
  // Create a snapshot from a group
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { groupId, name, description } = req.body;

      if (!groupId) {
        res.status(400).json({ error: 'groupId is required' });
        return;
      }

      // Fetch the group and verify ownership
      const category = await CategoryModel.findById(groupId);
      if (!category) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }
      if (!category.userId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Resolve all current transactions for this group
      const BankAccountModel = mongoose.model('BankAccount');
      const TransactionModel = mongoose.model('Transaction');

      const accessibleAccounts = await BankAccountModel.find({
        $or: [
          { owner: new mongoose.Types.ObjectId(userId) },
          { sharedWith: new mongoose.Types.ObjectId(userId) },
        ],
      });
      const accessibleAccountIds = accessibleAccounts.map((a: any) => a._id);

      const allTransactions = await TransactionModel.find({
        accountId: { $in: accessibleAccountIds },
      })
        .populate(['accountId', 'category', 'tags'])
        .sort({ date: -1 });

      const excludedIds = new Set(
        (category.excludedTransactionIds || []).map((id) => id.toString()),
      );

      const ruleMatched = allTransactions.filter(
        (t: any) =>
          category.matchesTransaction(t) && !excludedIds.has(t._id.toString()),
      );

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
        });
      }

      const allMatchingIds = [
        ...ruleMatched.map((t: any) => t._id),
        ...manualTransactions.map((t: any) => t._id),
      ];

      const snapshot = new SnapshotModel({
        ownerId: new mongoose.Types.ObjectId(userId),
        groupId: category._id,
        groupName: category.name,
        groupIcon: category.icon,
        groupColor: category.color,
        name:
          name ||
          `${category.name} – Snapshot ${new Date().toLocaleDateString()}`,
        description,
        transactionIds: allMatchingIds,
        collaborators: [],
      });

      await snapshot.save();
      res.status(201).json(snapshot);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get all snapshots (mine + shared with me)
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const snapshots = await SnapshotModel.find({
        $or: [{ ownerId: userObjectId }, { collaborators: userObjectId }],
      }).sort({ createdAt: -1 });

      res.json(snapshots);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get snapshot by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const snapshot = await SnapshotModel.findById(id);
      if (!snapshot) {
        res.status(404).json({ error: 'Snapshot not found' });
        return;
      }

      const hasAccess =
        snapshot.ownerId.equals(userObjectId) ||
        snapshot.collaborators.some((c) => c.equals(userObjectId));

      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json(snapshot);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Update snapshot metadata (owner only)
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { name, description } = req.body;

      const snapshot = await SnapshotModel.findById(id);
      if (!snapshot) {
        res.status(404).json({ error: 'Snapshot not found' });
        return;
      }
      if (!snapshot.ownerId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (name !== undefined) snapshot.name = name;
      if (description !== undefined) snapshot.description = description;
      await snapshot.save();

      res.json(snapshot);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Delete snapshot (owner only)
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const snapshot = await SnapshotModel.findById(id);
      if (!snapshot) {
        res.status(404).json({ error: 'Snapshot not found' });
        return;
      }
      if (!snapshot.ownerId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await SnapshotModel.findByIdAndDelete(id);
      res.json({ message: 'Snapshot deleted successfully' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get transactions for snapshot (with pagination + filters)
  static async getTransactions(
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
        search,
        creditDebitIndicator,
        minAmount,
        maxAmount,
        page,
        limit,
      } = req.query;

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const snapshot = await SnapshotModel.findById(id);
      if (!snapshot) {
        res.status(404).json({ error: 'Snapshot not found' });
        return;
      }

      const hasAccess =
        snapshot.ownerId.equals(userObjectId) ||
        snapshot.collaborators.some((c) => c.equals(userObjectId));
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const TransactionModel = mongoose.model('Transaction');

      let query: any = { _id: { $in: snapshot.transactionIds } };
      if (accountId) query.accountId = accountId;
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

      const pageNumber = parseInt(page as string) || 1;
      const pageSize = parseInt(limit as string) || 50;
      const skip = (pageNumber - 1) * pageSize;

      const [transactions, totalCount] = await Promise.all([
        TransactionModel.find(query)
          .populate(['accountId', 'category', 'tags'])
          .sort({ date: -1 })
          .skip(skip)
          .limit(pageSize),
        TransactionModel.countDocuments(query),
      ]);

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

  // Get totals for snapshot
  static async getTotals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const {
        accountId,
        startDate,
        endDate,
        search,
        creditDebitIndicator,
        minAmount,
        maxAmount,
      } = req.query;

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const snapshot = await SnapshotModel.findById(id);
      if (!snapshot) {
        res.status(404).json({ error: 'Snapshot not found' });
        return;
      }

      const hasAccess =
        snapshot.ownerId.equals(userObjectId) ||
        snapshot.collaborators.some((c) => c.equals(userObjectId));
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const TransactionModel = mongoose.model('Transaction');

      let query: any = { _id: { $in: snapshot.transactionIds } };
      if (accountId) query.accountId = accountId;
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

      const transactions = await TransactionModel.find(query);

      let totalCredit = 0;
      let totalDebit = 0;
      const byCurrency: Record<string, { credit: number; debit: number }> = {};

      for (const txn of transactions) {
        const amount = (txn as any).amount?.sum || 0;
        const currency = (txn as any).amount?.currency || 'RON';
        const indicator = (txn as any).creditDebitIndicator;

        if (!byCurrency[currency]) {
          byCurrency[currency] = { credit: 0, debit: 0 };
        }

        if (indicator === 'Credit') {
          byCurrency[currency].credit += amount;
        } else {
          byCurrency[currency].debit += amount;
        }
      }

      // Convert to RON using in-memory rates
      const currencyRates = getCurrencyRates();

      for (const [currency, amounts] of Object.entries(byCurrency)) {
        let rate = 1;
        if (currency !== 'RON' && currencyRates) {
          const rateKey = `${currency}_RON` as keyof typeof currencyRates;
          rate = (currencyRates[rateKey] as number) || 1;
        }
        totalCredit += amounts.credit * rate;
        totalDebit += amounts.debit * rate;
      }

      res.json({
        credit: totalCredit,
        debit: totalDebit,
        balance: totalCredit - totalDebit,
        byCurrency,
      });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Add a transaction to snapshot (owner or collaborator)
  static async addTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id, transactionId } = req.params;
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const snapshot = await SnapshotModel.findById(id);
      if (!snapshot) {
        res.status(404).json({ error: 'Snapshot not found' });
        return;
      }

      const hasAccess =
        snapshot.ownerId.equals(userObjectId) ||
        snapshot.collaborators.some((c) => c.equals(userObjectId));
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const txnObjectId = new mongoose.Types.ObjectId(transactionId as string);
      const alreadyAdded = snapshot.transactionIds.some((t) =>
        t.equals(txnObjectId),
      );
      if (!alreadyAdded) {
        snapshot.transactionIds.push(txnObjectId);
        await snapshot.save();
      }

      res.json({ message: 'Transaction added to snapshot' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Remove a transaction from snapshot (owner or collaborator)
  static async removeTransaction(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user.id;
      const { id, transactionId } = req.params;
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const snapshot = await SnapshotModel.findById(id);
      if (!snapshot) {
        res.status(404).json({ error: 'Snapshot not found' });
        return;
      }

      const hasAccess =
        snapshot.ownerId.equals(userObjectId) ||
        snapshot.collaborators.some((c) => c.equals(userObjectId));
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const txnObjectId = new mongoose.Types.ObjectId(transactionId as string);
      snapshot.transactionIds = snapshot.transactionIds.filter(
        (t) => !t.equals(txnObjectId),
      );
      await snapshot.save();

      res.json({ message: 'Transaction removed from snapshot' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Add a collaborator by email (owner only)
  static async addCollaborator(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ error: 'email is required' });
        return;
      }

      const snapshot = await SnapshotModel.findById(id);
      if (!snapshot) {
        res.status(404).json({ error: 'Snapshot not found' });
        return;
      }
      if (!snapshot.ownerId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const UserModel = mongoose.model('User');
      const collaboratorUser = await UserModel.findOne({ email });
      if (!collaboratorUser) {
        res.status(404).json({ error: 'User not found with that email' });
        return;
      }

      const collaboratorId = (collaboratorUser as any)
        ._id as mongoose.Types.ObjectId;

      if (collaboratorId.equals(new mongoose.Types.ObjectId(userId))) {
        res
          .status(400)
          .json({ error: 'Cannot add yourself as a collaborator' });
        return;
      }

      const alreadyAdded = snapshot.collaborators.some((c) =>
        c.equals(collaboratorId),
      );
      if (!alreadyAdded) {
        snapshot.collaborators.push(collaboratorId);
        await snapshot.save();
      }

      res.json({
        message: 'Collaborator added',
        collaborator: {
          _id: collaboratorUser._id,
          email: (collaboratorUser as any).email,
          firstName: (collaboratorUser as any).firstName,
          lastName: (collaboratorUser as any).lastName,
        },
      });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Remove a collaborator (owner only)
  static async removeCollaborator(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user.id;
      const { id, collaboratorId } = req.params;

      const snapshot = await SnapshotModel.findById(id);
      if (!snapshot) {
        res.status(404).json({ error: 'Snapshot not found' });
        return;
      }
      if (!snapshot.ownerId.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const collabObjectId = new mongoose.Types.ObjectId(
        collaboratorId as string,
      );
      snapshot.collaborators = snapshot.collaborators.filter(
        (c) => !c.equals(collabObjectId),
      );
      await snapshot.save();

      res.json({ message: 'Collaborator removed' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get collaborator details for a snapshot
  static async getCollaborators(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const snapshot = await SnapshotModel.findById(id);
      if (!snapshot) {
        res.status(404).json({ error: 'Snapshot not found' });
        return;
      }

      const hasAccess =
        snapshot.ownerId.equals(userObjectId) ||
        snapshot.collaborators.some((c) => c.equals(userObjectId));
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const UserModel = mongoose.model('User');
      const collaborators = await UserModel.find(
        { _id: { $in: snapshot.collaborators } },
        { _id: 1, firstName: 1, lastName: 1, email: 1 },
      );

      res.json(collaborators);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }
}
