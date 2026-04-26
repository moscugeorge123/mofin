import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICurrencyRates {
  USD_RON: number;
  EUR_RON: number;
  JPY_RON: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CurrencyRatesDocument = ICurrencyRates & Document;

const CurrencyRatesSchema = new Schema<ICurrencyRates>(
  {
    USD_RON: {
      type: Number,
      required: true,
    },
    EUR_RON: {
      type: Number,
      required: true,
    },
    JPY_RON: {
      type: Number,
      required: true,
    },
    lastUpdated: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const CurrencyRatesModel: Model<ICurrencyRates> =
  mongoose.model<ICurrencyRates>('CurrencyRates', CurrencyRatesSchema);
