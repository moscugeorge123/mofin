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
}
