import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReceiptProduct {
  // References
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  receiptId: mongoose.Types.ObjectId;

  // Product details at time of purchase
  name: string;
  price: number;
  quantity: number;
  quantityType: string;
  discount?: number;

  // Timestamps (auto-generated)
  createdAt: Date;
  updatedAt: Date;
}

export interface IReceiptProductMethods {
  getTotalPrice(): number;
  getDiscountedPrice(): number;
  getPricePerUnit(): number;
}

export interface ReceiptProductModel extends Model<
  IReceiptProduct,
  {},
  IReceiptProductMethods
> {
  findByReceipt(
    receiptId: mongoose.Types.ObjectId,
  ): Promise<ReceiptProductDocument[]>;
  findByProduct(
    productId: mongoose.Types.ObjectId,
  ): Promise<ReceiptProductDocument[]>;
  findByUser(
    userId: mongoose.Types.ObjectId,
  ): Promise<ReceiptProductDocument[]>;
}

export type ReceiptProductDocument = Document<unknown, {}, IReceiptProduct> &
  IReceiptProduct &
  IReceiptProductMethods;

const receiptProductSchema = new Schema<
  IReceiptProduct,
  ReceiptProductModel,
  IReceiptProductMethods
>(
  {
    // References
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
      index: true,
    },
    receiptId: {
      type: Schema.Types.ObjectId,
      ref: 'Receipt',
      required: [true, 'Receipt ID is required'],
      index: true,
    },

    // Product details at time of purchase
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    quantityType: {
      type: String,
      required: [true, 'Quantity type is required'],
      trim: true,
      enum: {
        values: ['Kg', 'g', 'l', 'mL', 'BUC'],
        message: '{VALUE} is not a valid quantity type',
      },
    },
    discount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    methods: {
      // Calculate total price (price * quantity)
      getTotalPrice(): number {
        return this.price * this.quantity;
      },

      // Calculate price after discount
      getDiscountedPrice(): number {
        const total = this.getTotalPrice();
        if (!this.discount) return total;
        return total - (total * this.discount) / 100;
      },

      // Get price per unit
      getPricePerUnit(): number {
        return this.price;
      },
    },
    statics: {
      // Find all products in a receipt
      async findByReceipt(
        receiptId: mongoose.Types.ObjectId,
      ): Promise<ReceiptProductDocument[]> {
        return this.find({ receiptId }).populate(
          'productId',
        ) as unknown as ReceiptProductDocument[];
      },

      // Find all receipt entries for a specific product
      async findByProduct(
        productId: mongoose.Types.ObjectId,
      ): Promise<ReceiptProductDocument[]> {
        return this.find({ productId }).populate(
          'receiptId',
        ) as unknown as ReceiptProductDocument[];
      },

      // Find all receipt products by user
      async findByUser(
        userId: mongoose.Types.ObjectId,
      ): Promise<ReceiptProductDocument[]> {
        return this.find({ userId }).populate([
          'productId',
          'receiptId',
        ]) as unknown as ReceiptProductDocument[];
      },
    },
  },
);

// Compound indexes for common queries
receiptProductSchema.index({ receiptId: 1, productId: 1 });
receiptProductSchema.index({ userId: 1, productId: 1 });
receiptProductSchema.index({ productId: 1, createdAt: -1 });

// Virtual for formatted quantity
receiptProductSchema.virtual('formattedQuantity').get(function () {
  return `${this.quantity} ${this.quantityType}`;
});

// Virtual for formatted total price
receiptProductSchema.virtual('formattedTotalPrice').get(function () {
  return this.getTotalPrice().toFixed(2);
});

// Virtual for formatted discounted price
receiptProductSchema.virtual('formattedDiscountedPrice').get(function () {
  return this.getDiscountedPrice().toFixed(2);
});

// Ensure virtuals are included in JSON
receiptProductSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    ret.__v = NaN;
    return ret;
  },
});

receiptProductSchema.set('toObject', { virtuals: true });

export const ReceiptProductModel = mongoose.model<
  IReceiptProduct,
  ReceiptProductModel
>('ReceiptProduct', receiptProductSchema);
