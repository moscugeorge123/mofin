import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IReceipt {
  // User & Transaction
  userId: mongoose.Types.ObjectId;
  transactionId: mongoose.Types.ObjectId;

  // Receipt details
  price: number;
  store?: string;
  location?: string;
  date: Date;

  // Timestamps (auto-generated)
  createdAt: Date;
  updatedAt: Date;
}

export interface IReceiptMethods {
  getTotalPrice(): number;
  getProducts(): Promise<any[]>;
}

export interface ReceiptModel extends Model<IReceipt, {}, IReceiptMethods> {
  findByUser(userId: mongoose.Types.ObjectId): Promise<ReceiptDocument[]>;
  findByTransaction(
    transactionId: mongoose.Types.ObjectId,
  ): Promise<ReceiptDocument[]>;
  findByDateRange(
    userId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<ReceiptDocument[]>;
  findByStore(store: string): Promise<ReceiptDocument[]>;
}

export type ReceiptDocument = Document<unknown, {}, IReceipt> &
  IReceipt &
  IReceiptMethods;

const receiptSchema = new Schema<IReceipt, ReceiptModel, IReceiptMethods>(
  {
    // User & Transaction
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: [true, 'Transaction ID is required'],
      index: true,
    },

    // Receipt details
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    store: {
      type: String,
      trim: true,
      maxlength: [200, 'Store name cannot exceed 200 characters'],
      index: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Receipt date is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    methods: {
      // Get total price (same as price field, kept for compatibility)
      getTotalPrice(): number {
        return this.price;
      },

      // Get all products associated with this receipt
      async getProducts(): Promise<any[]> {
        const ReceiptProduct = mongoose.model('ReceiptProduct');
        return ReceiptProduct.find({ receiptId: this._id }).populate(
          'productId',
        );
      },
    },
    statics: {
      // Find all receipts by user
      async findByUser(
        userId: mongoose.Types.ObjectId,
      ): Promise<ReceiptDocument[]> {
        return this.find({ userId }).sort({
          date: -1,
        }) as unknown as ReceiptDocument[];
      },

      // Find receipts by transaction
      async findByTransaction(
        transactionId: mongoose.Types.ObjectId,
      ): Promise<ReceiptDocument[]> {
        return this.find({ transactionId });
      },

      // Find receipts within a date range
      async findByDateRange(
        userId: mongoose.Types.ObjectId,
        startDate: Date,
        endDate: Date,
      ): Promise<ReceiptDocument[]> {
        return this.find({
          userId,
          date: { $gte: startDate, $lte: endDate },
        }).sort({ date: -1 }) as unknown as ReceiptDocument[];
      },

      // Find receipts by store
      async findByStore(store: string): Promise<ReceiptDocument[]> {
        return this.find({
          store: { $regex: new RegExp(store, 'i') },
        }).sort({ date: -1 }) as unknown as ReceiptDocument[];
      },
    },
  },
);

// Compound indexes for common queries
receiptSchema.index({ userId: 1, date: -1 });
receiptSchema.index({ userId: 1, store: 1 });
receiptSchema.index({ transactionId: 1, date: -1 });

// Virtual for formatted price
receiptSchema.virtual('formattedPrice').get(function () {
  return `${this.price.toFixed(2)}`;
});

// Ensure virtuals are included in JSON
receiptSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    ret.__v = NaN;
    return ret;
  },
});

receiptSchema.set('toObject', { virtuals: true });

export const ReceiptModel = mongoose.model<IReceipt, ReceiptModel>(
  'Receipt',
  receiptSchema,
);
