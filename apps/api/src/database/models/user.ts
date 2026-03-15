import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose, { Document, Model, Schema } from 'mongoose';
import config from '../../config/config';

const SALT = config.salt as string;

export interface IUser {
  // Core fields
  firstName: string;
  lastName: string;
  email: string;
  password: string;

  // Relationships
  bankAccounts: mongoose.Types.ObjectId[];
  groups: mongoose.Types.ObjectId[];

  // Security & Authentication
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  isActive: boolean;
  isLocked: boolean;
  failedLoginAttempts: number;
  lockUntil?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;

  // Audit & Compliance
  lastLoginAt?: Date;
  lastLoginIp?: string;
  role: 'user' | 'admin' | 'accountant';
  deletedAt?: Date;

  // User Preferences
  timezone: string;
  locale: string;
  currency: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    transactionAlerts: boolean;
  };

  // Timestamps (auto-generated)
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
  incrementFailedLogins(): Promise<void>;
  resetFailedLogins(): Promise<void>;
  isAccountLocked(): boolean;
}

export interface UserModel extends Model<IUser, {}, IUserMethods> {
  findByEmail(email: string): Promise<UserDocument | null>;
  findActiveUsers(): Promise<UserDocument[]>;
}

export type UserDocument = Document<unknown, {}, IUser> & IUser & IUserMethods;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    // Core fields
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },

    // Relationships
    bankAccounts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'BankAccount',
      },
    ],
    groups: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Group',
      },
    ],

    // Security & Authentication
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },

    // Audit & Compliance
    lastLoginAt: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin', 'accountant'],
        message: '{VALUE} is not a valid role',
      },
      default: 'user',
      index: true,
    },
    deletedAt: {
      type: Date,
      index: true,
    },

    // User Preferences
    timezone: {
      type: String,
      default: 'UTC',
    },
    locale: {
      type: String,
      default: 'en-US',
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      transactionAlerts: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
    methods: {
      // Instance method to compare passwords
      async comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.password);
      },

      // Generate password reset token
      generatePasswordResetToken(): string {
        const resetToken = crypto.randomBytes(32).toString('hex');
        this.passwordResetToken = crypto
          .createHash('sha256')
          .update(resetToken)
          .digest('hex');
        this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        return resetToken;
      },

      // Generate email verification token
      generateEmailVerificationToken(): string {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        this.emailVerificationToken = crypto
          .createHash('sha256')
          .update(verificationToken)
          .digest('hex');
        this.emailVerificationExpires = new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ); // 24 hours
        return verificationToken;
      },

      // Increment failed login attempts
      async incrementFailedLogins(): Promise<void> {
        // Reset if lock has expired
        if (this.lockUntil && this.lockUntil < new Date()) {
          await this.updateOne({
            $set: { failedLoginAttempts: 1 },
            $unset: { lockUntil: 1 },
          });
          return;
        }

        const updates: any = { $inc: { failedLoginAttempts: 1 } };
        const maxAttempts = 5;
        const lockTime = 2 * 60 * 60 * 1000; // 2 hours

        // Lock account if max attempts reached
        if (this.failedLoginAttempts + 1 >= maxAttempts && !this.isLocked) {
          updates.$set = {
            isLocked: true,
            lockUntil: new Date(Date.now() + lockTime),
          };
        }

        await this.updateOne(updates);
      },

      // Reset failed login attempts
      async resetFailedLogins(): Promise<void> {
        await this.updateOne({
          $set: { failedLoginAttempts: 0 },
          $unset: { lockUntil: 1, isLocked: 1 },
        });
      },

      // Check if account is locked
      isAccountLocked(): boolean {
        if (!this.lockUntil) return false;
        return this.lockUntil > new Date();
      },
    },
    statics: {
      // Find user by email
      async findByEmail(email: string): Promise<UserDocument | null> {
        return this.findOne({ email: email.toLowerCase(), deletedAt: null });
      },

      // Find all active users
      async findActiveUsers(): Promise<UserDocument[]> {
        return this.find({ isActive: true, deletedAt: null });
      },
    },
  },
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for initials
userSchema.virtual('initials').get(function () {
  return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, +SALT);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compound indexes for common queries
userSchema.index({ email: 1, isActive: 1 });
// userSchema.index({ deletedAt: 1, isActive: 1 });

// Ensure virtuals are included in JSON
userSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    ret.password = undefined as unknown as string; // Don't return password
    ret.emailVerificationToken = undefined;
    ret.emailVerificationExpires = undefined;
    ret.__v = NaN;
    return ret;
  },
});

userSchema.set('toObject', { virtuals: true });

export const UserModel = mongoose.model<IUser, UserModel>('User', userSchema);
