import { Router } from 'express';
import { CurrencyRatesController } from '../controllers/currency-rates.controller';

const router = Router();

router.get('/', CurrencyRatesController.get);

export default router;
