import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISnapshot {
  ownerId: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  // Denormalized group info frozen at creation time
  groupName: string;
  groupIcon?: string;
  groupColor?: string;
  // Snapshot metadata
  name: string;
  description?: string;
  // Frozen transaction list
  transactionIds: mongoose.Types.ObjectId[];
  // Collaborators (other users who can view)
  collaborators: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SnapshotModel extends Model<ISnapshot> {}

export type SnapshotDocument = Document<unknown, {}, ISnapshot> & ISnapshot;

const snapshotSchema = new Schema<ISnapshot, SnapshotModel>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Group ID is required'],
    },
    groupName: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
    },
    groupIcon: {
      type: String,
      trim: true,
    },
    groupColor: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Snapshot name is required'],
      trim: true,
      maxlength: [200, 'Snapshot name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    transactionIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }],
      default: [],
    },
    collaborators: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

snapshotSchema.index({ ownerId: 1, createdAt: -1 });
snapshotSchema.index({ collaborators: 1 });

snapshotSchema.set('toJSON', { virtuals: true });
snapshotSchema.set('toObject', { virtuals: true });

export const SnapshotModel = mongoose.model<ISnapshot, SnapshotModel>(
  'Snapshot',
  snapshotSchema,
);
