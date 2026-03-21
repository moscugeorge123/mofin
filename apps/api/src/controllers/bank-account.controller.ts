import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { BankAccountModel } from '../database/models/bank-account';
import { UserModel } from '../database/models/user';
import { catchMongoValidation } from '../helpers/catch-mongo-validation';

export class BankAccountController {
  // Create a new bank account
  static async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const {
        bankAccountId,
        name,
        description,
        currency,
        type,
        subType,
        accessGivenTo,
      } = req.body;

      // Generate bankAccountId if not provided
      const generatedId =
        bankAccountId ||
        `BA-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const bankAccount = new BankAccountModel({
        bankAccountId: generatedId,
        name,
        description,
        owner: userId,
        currency,
        type,
        subType,
        accessGivenTo: accessGivenTo || [],
      });

      await bankAccount.save();
      res.status(201).json(bankAccount);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get all bank accounts for the authenticated user
  static async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const accounts = await BankAccountModel.findAccessibleByUser(
        new mongoose.Types.ObjectId(userId),
      );
      res.json(accounts);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get bank account by ID
  static async getById(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const account = await BankAccountModel.findById(id);

      if (!account) {
        res.status(404).json({ error: 'Bank account not found' });
        return;
      }

      // Check if user has access
      if (!account.hasAccess(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json(account);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Update bank account
  static async update(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const updates = req.body;

      const account = await BankAccountModel.findById(id);

      if (!account) {
        res.status(404).json({ error: 'Bank account not found' });
        return;
      }

      // Only owner can update
      if (!account.owner.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Only owner can update account' });
        return;
      }

      // Prevent changing owner
      delete updates.owner;

      Object.assign(account, updates);
      await account.save();

      res.json(account);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }
  // Delete bank account
  static async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const account = await BankAccountModel.findById(id);

      if (!account) {
        res.status(404).json({ error: 'Bank account not found' });
        return;
      }

      // Only owner can delete
      if (!account.owner.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Only owner can delete account' });
        return;
      }

      await BankAccountModel.findByIdAndDelete(id);
      res.json({ message: 'Bank account deleted successfully' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Grant access to another user
  static async grantAccess(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { targetUserId, email } = req.body;

      const account = await BankAccountModel.findById(id);

      if (!account) {
        res.status(404).json({ error: 'Bank account not found' });
        return;
      }

      if (!account.owner.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Only owner can grant access' });
        return;
      }

      let targetUserObjectId: mongoose.Types.ObjectId;

      // Support both email and userId
      if (email) {
        const targetUser = await UserModel.findByEmail(email);
        if (!targetUser) {
          res.status(404).json({ error: 'User not found with that email' });
          return;
        }
        targetUserObjectId = targetUser._id as mongoose.Types.ObjectId;
      } else if (targetUserId) {
        targetUserObjectId = new mongoose.Types.ObjectId(targetUserId);
      } else {
        res
          .status(400)
          .json({ error: 'Either email or targetUserId is required' });
        return;
      }

      await account.grantAccess(targetUserObjectId);
      res.json(account);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Revoke access from a user
  static async revokeAccess(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { targetUserId } = req.body;

      const account = await BankAccountModel.findById(id);

      if (!account) {
        res.status(404).json({ error: 'Bank account not found' });
        return;
      }

      if (!account.owner.equals(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Only owner can revoke access' });
        return;
      }

      await account.revokeAccess(new mongoose.Types.ObjectId(targetUserId));
      res.json(account);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get collaborators (users with access) for a bank account
  static async getCollaborators(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const account = await BankAccountModel.findById(id).populate(
        'accessGivenTo',
        '_id firstName lastName email',
      );

      if (!account) {
        res.status(404).json({ error: 'Bank account not found' });
        return;
      }

      // Check if user has access
      if (!account.hasAccess(new mongoose.Types.ObjectId(userId))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json({ collaborators: account.accessGivenTo });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }
}
