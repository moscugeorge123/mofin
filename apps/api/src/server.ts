import cors from 'cors';
import express from 'express';
import config from './config/config';
import { connectToDatabase } from './database/connection';
import { errorHandler } from './middlewares/error-handler';
import bankAccountRoutes from './routes/bank-account.routes';
import categoryRoutes from './routes/category.routes';
import productRoutes from './routes/product.routes';
import receiptExtractionRoutes from './routes/receipt-extraction.routes';
import receiptProductRoutes from './routes/receipt-product.routes';
import receiptRoutes from './routes/receipt.routes';
import tagRoutes from './routes/tag.routes';
import transactionRoutes from './routes/transactions.routes';
import userRoutes from './routes/user.routes';

// Connect to the database
connectToDatabase().then(() => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/', (req, res) => {
    res.json({ ok: 1 });
  });

  // Routes
  app.use('/api/users', userRoutes);
  app.use('/api/bank-accounts', bankAccountRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/tags', tagRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/receipts', receiptRoutes);
  app.use('/api/receipt-products', receiptProductRoutes);
  app.use('/api/receipt-extraction', receiptExtractionRoutes);

  // Global error handler (should be after routes)
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`✅ Server running on port ${config.port}`);
  });
});
