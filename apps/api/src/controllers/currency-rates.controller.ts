import { Request, Response } from 'express';
import { getCurrencyRates } from '../services/currency-rates.service';

export class CurrencyRatesController {
  static get(req: Request, res: Response) {
    const rates = getCurrencyRates();
    if (!rates) {
      return res
        .status(503)
        .json({ message: 'Currency rates not available yet' });
    }
    res.json(rates);
  }
}
