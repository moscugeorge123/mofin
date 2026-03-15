import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITransactionFile {
  // User reference
  userId: mongoose.Types.ObjectId;

  // File information
  filePath: string;
  originalName: string;
  mimeType: string;
  fileSize: number;

  // Processing status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;

  // Extracted transactions
  transactions: mongoose.Types.ObjectId[];
  extractedData?: any; // Raw extracted data from ChatGPT

  // Timestamps (auto-generated)
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransactionFileMethods {
  markAsProcessing(): Promise<void>;
  markAsCompleted(transactionIds: mongoose.Types.ObjectId[]): Promise<void>;
  markAsFailed(errorMessage: string): Promise<void>;
}

export interface TransactionFileModel extends Model<
  ITransactionFile,
  {},
  ITransactionFileMethods
> {
  findByUser(
    userId: mongoose.Types.ObjectId,
  ): Promise<TransactionFileDocument[]>;
  findPending(): Promise<TransactionFileDocument[]>;
}

export type TransactionFileDocument = Document<unknown, {}, ITransactionFile> &
  ITransactionFile &
  ITransactionFileMethods;

const transactionFileSchema = new Schema<
  ITransactionFile,
  TransactionFileModel,
  ITransactionFileMethods
>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    // File information
    filePath: {
      type: String,
      required: [true, 'File path is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size must be positive'],
    },

    // Processing status
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['pending', 'processing', 'completed', 'failed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
      index: true,
    },
    errorMessage: {
      type: String,
      trim: true,
    },

    // Extracted transactions
    transactions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    ],
    extractedData: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.__v = NaN;
        return ret;
      },
    },
  },
);

// Instance Methods
transactionFileSchema.methods.markAsProcessing =
  async function (): Promise<void> {
    this.status = 'processing';
    await this.save();
  };

transactionFileSchema.methods.markAsCompleted = async function (
  transactionIds: mongoose.Types.ObjectId[],
): Promise<void> {
  this.status = 'completed';
  this.transactions = transactionIds;
  await this.save();
};

transactionFileSchema.methods.markAsFailed = async function (
  errorMessage: string,
): Promise<void> {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  await this.save();
};

// Static Methods
transactionFileSchema.statics.findByUser = function (
  userId: mongoose.Types.ObjectId,
): Promise<TransactionFileDocument[]> {
  return this.find({ userId })
    .populate('transactions')
    .sort({ createdAt: -1 })
    .exec();
};

transactionFileSchema.statics.findPending = function (): Promise<
  TransactionFileDocument[]
> {
  return this.find({ status: 'pending' }).sort({ createdAt: 1 }).exec();
};

// Create Indexes
transactionFileSchema.index({ userId: 1, createdAt: -1 });
transactionFileSchema.index({ status: 1, createdAt: 1 });

export const TransactionFileModel = mongoose.model<
  ITransactionFile,
  TransactionFileModel
>('TransactionFile', transactionFileSchema);
