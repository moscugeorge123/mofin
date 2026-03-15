import { NextFunction, Request, Response } from 'express';
import { ProductModel } from '../database/models/product';
import { catchMongoValidation } from '../helpers/catch-mongo-validation';

export class ProductController {
  // Create a new product
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, store, description, barcode, category, brand } = req.body;

      const product = new ProductModel({
        name,
        store,
        description,
        barcode,
        category,
        brand,
      });

      await product.save();
      res.status(201).json(product);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get all products
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, store, category, brand } = req.query;

      let query: any = {};

      if (store) query.store = { $regex: new RegExp(store as string, 'i') };
      if (category)
        query.category = { $regex: new RegExp(category as string, 'i') };
      if (brand) query.brand = { $regex: new RegExp(brand as string, 'i') };

      let products;
      if (search) {
        products = await ProductModel.searchProducts(search as string);
      } else {
        products = await ProductModel.find(query).sort({ name: 1 });
      }

      res.json(products);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get product by ID
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const product = await ProductModel.findById(id);

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json(product);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Update product
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const product = await ProductModel.findById(id);

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      Object.assign(product, updates);
      await product.save();

      res.json(product);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Delete product
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const product = await ProductModel.findById(id);

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      await ProductModel.findByIdAndDelete(id);
      res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get purchase history for a product
  static async getPurchaseHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      const product = await ProductModel.findById(id);

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      const history = await product.getPurchaseHistory();
      res.json(history);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get average price for a product
  static async getAveragePrice(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id } = req.params;

      const product = await ProductModel.findById(id);

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      const avgPrice = await product.getAveragePrice();
      res.json({ productId: id, averagePrice: avgPrice });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }
}
