import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IProduct {
  // Product details
  name: string;
  store?: string;

  // Optional metadata
  description?: string;
  barcode?: string;
  category?: string;
  brand?: string;

  // Timestamps (auto-generated)
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductMethods {
  getPurchaseHistory(): Promise<any[]>;
  getAveragePrice(): Promise<number>;
}

export interface ProductModel extends Model<IProduct, {}, IProductMethods> {
  findByName(name: string): Promise<ProductDocument[]>;
  findByStore(store: string): Promise<ProductDocument[]>;
  findByBarcode(barcode: string): Promise<ProductDocument | null>;
  searchProducts(query: string): Promise<ProductDocument[]>;
}

export type ProductDocument = Document<unknown, {}, IProduct> &
  IProduct &
  IProductMethods;

const productSchema = new Schema<IProduct, ProductModel, IProductMethods>(
  {
    // Product details
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      index: true,
    },
    store: {
      type: String,
      trim: true,
      maxlength: [200, 'Store name cannot exceed 200 characters'],
      index: true,
    },

    // Optional metadata
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    barcode: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [100, 'Brand cannot exceed 100 characters'],
      index: true,
    },
  },
  {
    timestamps: true,
    methods: {
      // Get purchase history for this product
      async getPurchaseHistory(): Promise<any[]> {
        const ReceiptProduct = mongoose.model('ReceiptProduct');
        return ReceiptProduct.find({ productId: this._id })
          .populate('receiptId')
          .sort({ createdAt: -1 });
      },

      // Calculate average price from purchase history
      async getAveragePrice(): Promise<number> {
        const ReceiptProduct = mongoose.model('ReceiptProduct');
        const result = await ReceiptProduct.aggregate([
          { $match: { productId: this._id } },
          {
            $group: {
              _id: null,
              avgPrice: { $avg: '$price' },
            },
          },
        ]);
        return result.length > 0 ? result[0].avgPrice : 0;
      },
    },
    statics: {
      // Find products by name (case-insensitive)
      async findByName(name: string): Promise<ProductDocument[]> {
        return this.find({
          name: { $regex: new RegExp(name, 'i') },
        });
      },

      // Find products by store
      async findByStore(store: string): Promise<ProductDocument[]> {
        return this.find({
          store: { $regex: new RegExp(store, 'i') },
        }).sort({ name: 1 }) as unknown as ProductDocument[];
      },

      // Find product by barcode
      async findByBarcode(barcode: string): Promise<ProductDocument | null> {
        return this.findOne({ barcode });
      },

      // Search products by name, brand, or category
      async searchProducts(query: string): Promise<ProductDocument[]> {
        const searchRegex = new RegExp(query, 'i');
        return this.find({
          $or: [
            { name: searchRegex },
            { brand: searchRegex },
            { category: searchRegex },
            { description: searchRegex },
          ],
        }).sort({ name: 1 }) as unknown as ProductDocument[];
      },
    },
  },
);

// Compound indexes for common queries
productSchema.index({ name: 1, store: 1 });
productSchema.index({ category: 1, brand: 1 });
productSchema.index({ store: 1, category: 1 });

// Text index for full-text search
productSchema.index({
  name: 'text',
  brand: 'text',
  category: 'text',
  description: 'text',
});

// Virtual for display name
productSchema.virtual('displayName').get(function () {
  if (this.brand) {
    return `${this.brand} ${this.name}`;
  }
  return this.name;
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    ret.__v = NaN;
    return ret;
  },
});

productSchema.set('toObject', { virtuals: true });

export const ProductModel = mongoose.model<IProduct, ProductModel>(
  'Product',
  productSchema,
);
