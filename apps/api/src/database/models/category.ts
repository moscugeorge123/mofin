import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICategoryRule {
  field: 'store' | 'location' | 'amount' | 'notes' | 'tags';
  operator:
    | 'equals'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'greaterThan'
    | 'lessThan'
    | 'between';
  value: string | number | string[];
  caseSensitive?: boolean;
}

export interface ICategory {
  // User & Category details
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;

  // Automation rules
  rules: ICategoryRule[];

  // Visual customization
  color?: string;
  icon?: string;

  // Statistics
  transactionCount?: number;

  // Timestamps (auto-generated)
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryMethods {
  matchesTransaction(transaction: any): boolean;
  applyToTransaction(transactionId: mongoose.Types.ObjectId): Promise<void>;
  getTransactions(): Promise<any[]>;
  updateTransactionCount(): Promise<number>;
}

export interface CategoryModel extends Model<ICategory, {}, ICategoryMethods> {
  findByUser(userId: mongoose.Types.ObjectId): Promise<CategoryDocument[]>;
  findByName(
    userId: mongoose.Types.ObjectId,
    name: string,
  ): Promise<CategoryDocument | null>;
  findMatchingCategory(
    userId: mongoose.Types.ObjectId,
    transaction: any,
  ): Promise<CategoryDocument | null>;
}

export type CategoryDocument = Document<unknown, {}, ICategory> &
  ICategory &
  ICategoryMethods;

const categoryRuleSchema = new Schema<ICategoryRule>(
  {
    field: {
      type: String,
      required: [true, 'Rule field is required'],
      enum: {
        values: ['store', 'location', 'amount', 'notes', 'tags'],
        message: '{VALUE} is not a valid field',
      },
    },
    operator: {
      type: String,
      required: [true, 'Rule operator is required'],
      enum: {
        values: [
          'equals',
          'contains',
          'startsWith',
          'endsWith',
          'greaterThan',
          'lessThan',
          'between',
        ],
        message: '{VALUE} is not a valid operator',
      },
    },
    value: {
      type: Schema.Types.Mixed,
      required: [true, 'Rule value is required'],
    },
    caseSensitive: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const categorySchema = new Schema<ICategory, CategoryModel, ICategoryMethods>(
  {
    // User & Category details
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Automation rules
    rules: {
      type: [categoryRuleSchema],
      default: [],
    },

    // Visual customization
    color: {
      type: String,
      trim: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code'],
      default: '#808080',
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [50, 'Icon name cannot exceed 50 characters'],
    },

    // Statistics
    transactionCount: {
      type: Number,
      default: 0,
      min: [0, 'Transaction count cannot be negative'],
    },
  },
  {
    timestamps: true,
    methods: {
      // Check if a transaction matches this category's rules
      matchesTransaction(transaction: any): boolean {
        if (this.rules.length === 0) return false;

        return this.rules.every((rule) => {
          const fieldValue = transaction[rule.field];

          // Handle null/undefined values
          if (fieldValue === null || fieldValue === undefined) return false;

          switch (rule.operator) {
            case 'equals':
              if (
                typeof fieldValue === 'string' &&
                typeof rule.value === 'string'
              ) {
                return rule.caseSensitive
                  ? fieldValue === rule.value
                  : fieldValue.toLowerCase() === rule.value.toLowerCase();
              }
              return fieldValue === rule.value;

            case 'contains':
              if (
                typeof fieldValue === 'string' &&
                typeof rule.value === 'string'
              ) {
                return rule.caseSensitive
                  ? fieldValue.includes(rule.value)
                  : fieldValue.toLowerCase().includes(rule.value.toLowerCase());
              }
              return false;

            case 'startsWith':
              if (
                typeof fieldValue === 'string' &&
                typeof rule.value === 'string'
              ) {
                return rule.caseSensitive
                  ? fieldValue.startsWith(rule.value)
                  : fieldValue
                      .toLowerCase()
                      .startsWith(rule.value.toLowerCase());
              }
              return false;

            case 'endsWith':
              if (
                typeof fieldValue === 'string' &&
                typeof rule.value === 'string'
              ) {
                return rule.caseSensitive
                  ? fieldValue.endsWith(rule.value)
                  : fieldValue.toLowerCase().endsWith(rule.value.toLowerCase());
              }
              return false;

            case 'greaterThan':
              return (
                typeof fieldValue === 'number' &&
                fieldValue > Number(rule.value)
              );

            case 'lessThan':
              return (
                typeof fieldValue === 'number' &&
                fieldValue < Number(rule.value)
              );

            case 'between':
              if (Array.isArray(rule.value) && rule.value.length === 2) {
                return (
                  typeof fieldValue === 'number' &&
                  fieldValue >= Number(rule.value[0]) &&
                  fieldValue <= Number(rule.value[1])
                );
              }
              return false;

            default:
              return false;
          }
        });
      },

      // Apply this category to a transaction
      async applyToTransaction(
        transactionId: mongoose.Types.ObjectId,
      ): Promise<void> {
        const Transaction = mongoose.model('Transaction');
        await Transaction.findByIdAndUpdate(transactionId, {
          category: this._id,
        });
        await this.updateTransactionCount();
      },

      // Get all transactions with this category
      async getTransactions(): Promise<any[]> {
        const Transaction = mongoose.model('Transaction');
        return Transaction.find({ category: this._id }).sort({ date: -1 });
      },

      // Update transaction count
      async updateTransactionCount(): Promise<number> {
        const Transaction = mongoose.model('Transaction');
        const count = await Transaction.countDocuments({ category: this._id });
        this.transactionCount = count;
        await this.save();
        return count;
      },
    },
    statics: {
      // Find all categories for a user
      async findByUser(
        userId: mongoose.Types.ObjectId,
      ): Promise<CategoryDocument[]> {
        return this.find({ userId }).sort({
          name: 1,
        }) as unknown as CategoryDocument[];
      },

      // Find category by name for a user
      async findByName(
        userId: mongoose.Types.ObjectId,
        name: string,
      ): Promise<CategoryDocument | null> {
        return this.findOne({
          userId,
          name: { $regex: new RegExp(`^${name}$`, 'i') },
        });
      },

      // Find the first matching category for a transaction
      async findMatchingCategory(
        userId: mongoose.Types.ObjectId,
        transaction: any,
      ): Promise<CategoryDocument | null> {
        const categories: CategoryDocument[] = await this.find({
          userId,
          'rules.0': { $exists: true },
        });

        for (const category of categories) {
          if (category.matchesTransaction(transaction)) {
            return category;
          }
        }

        return null;
      },
    },
  },
);

// Compound indexes for common queries
categorySchema.index({ userId: 1, name: 1 }, { unique: true });
categorySchema.index({ userId: 1, transactionCount: -1 });

// Virtual for rule count
categorySchema.virtual('ruleCount').get(function () {
  return this.rules.length;
});

// Ensure virtuals are included in JSON
categorySchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    ret.__v = NaN; // Remove version key
    return ret;
  },
});

categorySchema.set('toObject', { virtuals: true });

export const CategoryModel = mongoose.model<ICategory, CategoryModel>(
  'Category',
  categorySchema,
);
