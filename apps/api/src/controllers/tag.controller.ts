import { NextFunction, Request, Response } from 'express';
import { TagModel } from '../database/models/tag';
import { catchMongoValidation } from '../helpers/catch-mongo-validation';

export class TagController {
  // Create a new tag
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug, name, description, color } = req.body;

      const tag = new TagModel({
        slug,
        name,
        description,
        color,
      });

      await tag.save();
      res.status(201).json(tag);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Create tag from name (auto-generate slug)
  static async createFromName(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;

      const tag = await TagModel.createFromName(name);
      res.status(201).json(tag);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get all tags
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, limit } = req.query;

      let tags;
      if (search) {
        tags = await TagModel.searchTags(search as string);
      } else {
        tags = await TagModel.find().sort({ usageCount: -1, name: 1 });
      }

      if (limit) {
        tags = tags.slice(0, parseInt(limit as string));
      }

      res.json(tags);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get popular tags
  static async getPopular(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const tags = await TagModel.getPopularTags(limit);
      res.json(tags);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get tag by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const tag = await TagModel.findById(id);

      if (!tag) {
        res.status(404).json({ error: 'Tag not found' });
        return;
      }

      res.json(tag);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get tag by slug
  static async getBySlug(
    req: Request<{ slug: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { slug } = req.params;

      const tag = await TagModel.findBySlug(slug);

      if (!tag) {
        res.status(404).json({ error: 'Tag not found' });
        return;
      }

      res.json(tag);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Update tag
  static async update(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const tag = await TagModel.findById(id);

      if (!tag) {
        res.status(404).json({ error: 'Tag not found' });
        return;
      }

      Object.assign(tag, updates);
      await tag.save();

      res.json(tag);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Delete tag
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const tag = await TagModel.findById(id);

      if (!tag) {
        res.status(404).json({ error: 'Tag not found' });
        return;
      }

      await TagModel.findByIdAndDelete(id);
      res.json({ message: 'Tag deleted successfully' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get transactions for a tag
  static async getTransactions(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      const tag = await TagModel.findById(id);

      if (!tag) {
        res.status(404).json({ error: 'Tag not found' });
        return;
      }

      const transactions = await tag.getTransactions();
      res.json(transactions);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Update usage count
  static async updateCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const tag = await TagModel.findById(id);

      if (!tag) {
        res.status(404).json({ error: 'Tag not found' });
        return;
      }

      const count = await tag.updateUsageCount();
      res.json({ usageCount: count });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }
}
