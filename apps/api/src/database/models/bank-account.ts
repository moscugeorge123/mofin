import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IBankAccount {
  // Core fields
  bankAccountId: string;
  name: string;
  description?: string;

  // Ownership & Access
  owner: mongoose.Types.ObjectId;
  accessGivenTo: mongoose.Types.ObjectId[];

  // Account details
  currency: string;
  type: 'Personal' | 'Business';
  subType: 'CurrentAccount' | 'Savings' | 'CreditCard';

  // Timestamps (auto-generated)
  createdAt: Date;
  updatedAt: Date;
}

export interface IBankAccountMethods {
  grantAccess(userId: mongoose.Types.ObjectId): Promise<void>;
  revokeAccess(userId: mongoose.Types.ObjectId): Promise<void>;
  hasAccess(userId: mongoose.Types.ObjectId): boolean;
  isOwner(userId: mongoose.Types.ObjectId): boolean;
}

export interface BankAccountModel extends Model<
  IBankAccount,
  {},
  IBankAccountMethods
> {
  findByOwner(userId: mongoose.Types.ObjectId): Promise<BankAccountDocument[]>;
  findAccessibleByUser(
    userId: mongoose.Types.ObjectId,
  ): Promise<BankAccountDocument[]>;
}

export type BankAccountDocument = Document<unknown, {}, IBankAccount> &
  IBankAccount &
  IBankAccountMethods;

const bankAccountSchema = new Schema<
  IBankAccount,
  BankAccountModel,
  IBankAccountMethods
>(
  {
    bankAccountId: {
      type: String,
      required: false,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      maxlength: [100, 'Account name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Ownership & Access
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Account owner is required'],
      index: true,
    },
    accessGivenTo: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Account details
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      trim: true,
      length: [3, 'Currency must be 3 characters (ISO 4217)'],
      match: [/^[A-Z]{3}$/, 'Currency must be a valid ISO 4217 code'],
    },
    type: {
      type: String,
      required: [true, 'Account type is required'],
      enum: {
        values: ['Personal', 'Business'],
        message: '{VALUE} is not a valid account type',
      },
      index: true,
    },
    subType: {
      type: String,
      required: [true, 'Account sub-type is required'],
      enum: {
        values: ['CurrentAccount', 'Savings', 'CreditCard'],
        message: '{VALUE} is not a valid account sub-type',
      },
      index: true,
    },
  },
  {
    timestamps: true,
    methods: {
      // Grant access to another user
      async grantAccess(userId: mongoose.Types.ObjectId): Promise<void> {
        if (!this.accessGivenTo.some((id) => id.equals(userId))) {
          this.accessGivenTo.push(userId);
          await this.save();
        }
      },

      // Revoke access from a user
      async revokeAccess(userId: mongoose.Types.ObjectId): Promise<void> {
        this.accessGivenTo = this.accessGivenTo.filter(
          (id) => !id.equals(userId),
        );
        await this.save();
      },

      // Check if user has access
      hasAccess(userId: mongoose.Types.ObjectId): boolean {
        return (
          this.owner.equals(userId) ||
          this.accessGivenTo.some((id) => id.equals(userId))
        );
      },

      // Check if user is the owner
      isOwner(userId: mongoose.Types.ObjectId): boolean {
        return this.owner.equals(userId);
      },
    },
    statics: {
      // Find accounts owned by a user
      async findByOwner(
        userId: mongoose.Types.ObjectId,
      ): Promise<BankAccountDocument[]> {
        return this.find({ owner: userId });
      },

      // Find all accounts accessible by a user (owned or shared)
      async findAccessibleByUser(
        userId: mongoose.Types.ObjectId,
      ): Promise<BankAccountDocument[]> {
        return this.find({
          $or: [{ owner: userId }, { accessGivenTo: userId }],
        });
      },
    },
  },
);

// Compound indexes for common queries
bankAccountSchema.index({ owner: 1, type: 1 });
bankAccountSchema.index({ owner: 1, currency: 1 });
bankAccountSchema.index({ accessGivenTo: 1 });

// Virtual for display name with currency
bankAccountSchema.virtual('displayName').get(function () {
  return `${this.name} (${this.currency})`;
});

// Ensure virtuals are included in JSON
bankAccountSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    ret.__v = NaN; // Remove version key
    return ret;
  },
});

bankAccountSchema.set('toObject', { virtuals: true });

export const BankAccountModel = mongoose.model<IBankAccount, BankAccountModel>(
  'BankAccount',
  bankAccountSchema,
);
