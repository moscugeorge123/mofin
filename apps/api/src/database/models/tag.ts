import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ITag {
  // Tag identifiers
  slug: string;
  name: string;

  // Optional metadata
  description?: string;
  color?: string;

  // Statistics
  usageCount?: number;

  // Timestamps (auto-generated)
  createdAt: Date;
  updatedAt: Date;
}

export interface ITagMethods {
  incrementUsage(): Promise<void>;
  decrementUsage(): Promise<void>;
  getTransactions(): Promise<any[]>;
  updateUsageCount(): Promise<number>;
}

export interface TagModel extends Model<ITag, {}, ITagMethods> {
  findBySlug(slug: string): Promise<TagDocument | null>;
  findByName(name: string): Promise<TagDocument | null>;
  searchTags(query: string): Promise<TagDocument[]>;
  getPopularTags(limit?: number): Promise<TagDocument[]>;
  createFromName(name: string): Promise<TagDocument>;
}

export type TagDocument = Document<unknown, {}, ITag> & ITag & ITagMethods;

const tagSchema = new Schema<ITag, TagModel, ITagMethods>(
  {
    // Tag identifiers
    slug: {
      type: String,
      required: [true, 'Tag slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9_-]+$/,
        'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
      ],
      maxlength: [100, 'Slug cannot exceed 100 characters'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      trim: true,
      maxlength: [100, 'Tag name cannot exceed 100 characters'],
      index: true,
    },

    // Optional metadata
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    color: {
      type: String,
      trim: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code'],
      default: '#808080',
    },

    // Statistics
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative'],
      index: true,
    },
  },
  {
    timestamps: true,
    methods: {
      // Increment usage count
      async incrementUsage(): Promise<void> {
        this.usageCount = (this.usageCount || 0) + 1;
        await this.save();
      },

      // Decrement usage count
      async decrementUsage(): Promise<void> {
        if (this.usageCount && this.usageCount > 0) {
          this.usageCount -= 1;
          await this.save();
        }
      },

      // Get all transactions with this tag
      async getTransactions(): Promise<any[]> {
        const Transaction = mongoose.model('Transaction');
        return Transaction.find({ tags: this._id }).sort({ date: -1 });
      },

      // Update usage count based on actual transaction count
      async updateUsageCount(): Promise<number> {
        const Transaction = mongoose.model('Transaction');
        const count = await Transaction.countDocuments({ tags: this._id });
        this.usageCount = count;
        await this.save();
        return count;
      },
    },
    statics: {
      // Find tag by slug
      async findBySlug(slug: string): Promise<TagDocument | null> {
        return this.findOne({
          slug: slug.toLowerCase(),
        });
      },

      // Find tag by name (case-insensitive)
      async findByName(name: string): Promise<TagDocument | null> {
        return this.findOne({
          name: { $regex: new RegExp(`^${name}$`, 'i') },
        });
      },

      // Search tags by name or slug
      async searchTags(query: string): Promise<TagDocument[]> {
        const searchRegex = new RegExp(query, 'i');
        return this.find({
          $or: [
            { name: searchRegex },
            { slug: searchRegex },
            { description: searchRegex },
          ],
        }).sort({ usageCount: -1, name: 1 }) as unknown as TagDocument[];
      },

      // Get most popular tags
      async getPopularTags(limit: number = 10): Promise<TagDocument[]> {
        return this.find({ usageCount: { $gt: 0 } })
          .sort({ usageCount: -1 })
          .limit(limit) as unknown as TagDocument[];
      },

      // Create tag from name (auto-generate slug)
      async createFromName(name: string): Promise<TagDocument> {
        const slug = name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Check if tag already exists
        let tag = await (this as TagModel).findBySlug(slug);
        if (tag) return tag;

        // Create new tag
        tag = new (this as TagModel)({ slug, name: name.trim() });
        await tag.save();
        return tag;
      },
    },
  },
);

// Text index for full-text search
tagSchema.index({ name: 'text', description: 'text' });

// Compound index for sorting
tagSchema.index({ usageCount: -1, name: 1 });

// Virtual for display label
tagSchema.virtual('displayLabel').get(function () {
  return `${this.name} (${this.usageCount || 0})`;
});

// Pre-save hook to validate slug
tagSchema.pre('save', function (next) {
  if (this.isModified('slug')) {
    const slugRegex = /^[a-z0-9_-]+$/;
    if (!slugRegex.test(this.slug)) {
      return next(
        new Error(
          'Slug can only contain lowercase letters, numbers, hyphens, and underscores',
        ),
      );
    }
  }
  next();
});

// Ensure virtuals are included in JSON
tagSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    ret.__v = NaN;
    return ret;
  },
});

tagSchema.set('toObject', { virtuals: true });

export const TagModel = mongoose.model<ITag, TagModel>('Tag', tagSchema);
