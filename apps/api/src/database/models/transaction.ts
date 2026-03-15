import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITransactionAmount {
  sum: number;
  currency: string;
}

export interface ITransaction {
  // User & Account
  userId: mongoose.Types.ObjectId;
  bankTransactionId?: string;
  accountId: mongoose.Types.ObjectId;

  // Amount details
  amount: ITransactionAmount;

  // Transaction details
  notes?: string;
  state: 'sent' | 'received';
  relationBankAccount?: mongoose.Types.ObjectId;

  // Categorization
  tags: mongoose.Types.ObjectId[];
  category?: mongoose.Types.ObjectId;

  // Metadata
  location?: string;
  store?: string;
  creditDebitIndicator: 'Credit' | 'Debit';
  status: 'Booked' | 'Pending';
  date: Date;

  // Timestamps (auto-generated)
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionMethods {
  addTag(tagId: mongoose.Types.ObjectId): Promise<void>;
  removeTag(tagId: mongoose.Types.ObjectId): Promise<void>;
  setCategory(categoryId: mongoose.Types.ObjectId): Promise<void>;
  isExpense(): boolean;
  isIncome(): boolean;
}

export interface TransactionModel extends Model<
  ITransaction,
  {},
  ITransactionMethods
> {
  findByUser(userId: mongoose.Types.ObjectId): Promise<TransactionDocument[]>;
  findByAccount(
    accountId: mongoose.Types.ObjectId,
  ): Promise<TransactionDocument[]>;
  findByDateRange(
    accountId: mongoose.Types.ObjectId,
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionDocument[]>;
  findByCategory(
    categoryId: mongoose.Types.ObjectId,
  ): Promise<TransactionDocument[]>;
  getTotalByAccount(accountId: mongoose.Types.ObjectId): Promise<number>;
}

export type TransactionDocument = Document<unknown, {}, ITransaction> &
  ITransaction &
  ITransactionMethods;

const transactionSchema = new Schema<
  ITransaction,
  TransactionModel,
  ITransactionMethods
>(
  {
    // User & Account
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    bankTransactionId: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'BankAccount',
      required: [true, 'Account ID is required'],
      index: true,
    },

    // Amount details
    amount: {
      sum: {
        type: Number,
        required: [true, 'Amount is required'],
      },
      currency: {
        type: String,
        required: [true, 'Currency is required'],
        uppercase: true,
        trim: true,
        length: [3, 'Currency must be 3 characters (ISO 4217)'],
      },
    },

    // Transaction details
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      enum: {
        values: ['sent', 'received'],
        message: '{VALUE} is not a valid state',
      },
      index: true,
    },
    relationBankAccount: {
      type: Schema.Types.ObjectId,
      ref: 'BankAccount',
    },

    // Categorization
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },

    // Metadata
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    store: {
      type: String,
      trim: true,
      maxlength: [200, 'Store cannot exceed 200 characters'],
      index: true,
    },
    creditDebitIndicator: {
      type: String,
      required: [true, 'Credit/Debit indicator is required'],
      enum: {
        values: ['Credit', 'Debit'],
        message: '{VALUE} is not a valid credit/debit indicator',
      },
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['Booked', 'Pending'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Booked',
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    methods: {
      // Add a tag to the transaction
      async addTag(tagId: mongoose.Types.ObjectId): Promise<void> {
        if (!this.tags.some((id) => id.equals(tagId))) {
          this.tags.push(tagId);
          await this.save();
        }
      },

      // Remove a tag from the transaction
      async removeTag(tagId: mongoose.Types.ObjectId): Promise<void> {
        this.tags = this.tags.filter((id) => !id.equals(tagId));
        await this.save();
      },

      // Set category for the transaction
      async setCategory(categoryId: mongoose.Types.ObjectId): Promise<void> {
        this.category = categoryId;
        await this.save();
      },

      // Check if transaction is an expense
      isExpense(): boolean {
        return this.creditDebitIndicator === 'Debit' || this.state === 'sent';
      },

      // Check if transaction is income
      isIncome(): boolean {
        return (
          this.creditDebitIndicator === 'Credit' || this.state === 'received'
        );
      },
    },
    statics: {
      // Find all transactions by user
      async findByUser(
        userId: mongoose.Types.ObjectId,
      ): Promise<TransactionDocument[]> {
        return this.find({ userId }).sort({
          date: -1,
        }) as unknown as TransactionDocument[];
      },

      // Find all transactions by account
      async findByAccount(
        accountId: mongoose.Types.ObjectId,
      ): Promise<TransactionDocument[]> {
        return this.find({ accountId }).sort({
          date: -1,
        }) as unknown as TransactionDocument[];
      },

      // Find transactions within a date range
      async findByDateRange(
        accountId: mongoose.Types.ObjectId,
        startDate: Date,
        endDate: Date,
      ): Promise<TransactionDocument[]> {
        return this.find({
          accountId,
          date: { $gte: startDate, $lte: endDate },
        }).sort({ date: -1 }) as unknown as TransactionDocument[];
      },

      // Find transactions by category
      async findByCategory(
        categoryId: mongoose.Types.ObjectId,
      ): Promise<TransactionDocument[]> {
        return this.find({ category: categoryId }).sort({
          date: -1,
        }) as unknown as TransactionDocument[];
      },

      // Get total amount for an account
      async getTotalByAccount(
        accountId: mongoose.Types.ObjectId,
      ): Promise<number> {
        const result = await this.aggregate([
          { $match: { accountId, status: 'Booked' } },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $cond: [
                    { $eq: ['$creditDebitIndicator', 'Credit'] },
                    '$amount.sum',
                    { $multiply: ['$amount.sum', -1] },
                  ],
                },
              },
            },
          },
        ]);
        return result.length > 0 ? result[0].total : 0;
      },
    },
  },
);

// Compound indexes for common queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ accountId: 1, date: -1 });
transactionSchema.index({ userId: 1, accountId: 1 });
transactionSchema.index({ accountId: 1, status: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ tags: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function () {
  const sign = this.creditDebitIndicator === 'Debit' ? '-' : '+';
  return `${sign}${this.amount.sum.toFixed(2)} ${this.amount.currency}`;
});

// Virtual for display description
transactionSchema.virtual('displayDescription').get(function () {
  return this.notes || this.store || 'No description';
});

// Ensure virtuals are included in JSON
transactionSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    ret.__v = NaN;
    return ret;
  },
});

transactionSchema.set('toObject', { virtuals: true });

export const TransactionModel = mongoose.model<ITransaction, TransactionModel>(
  'Transaction',
  transactionSchema,
);
