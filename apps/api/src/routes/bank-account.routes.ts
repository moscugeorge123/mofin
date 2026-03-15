import { Router } from 'express';
import { BankAccountController } from '../controllers/bank-account.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new bank account
router.post('/', BankAccountController.create);

// Get all bank accounts
router.get('/', BankAccountController.getAll);

// Get bank account by ID
router.get('/:id', BankAccountController.getById);

// Update bank account
router.put('/:id', BankAccountController.update);

// Delete bank account
router.delete('/:id', BankAccountController.delete);

// Grant access to another user
router.post('/:id/grant-access', BankAccountController.grantAccess);

// Revoke access from a user
router.post('/:id/revoke-access', BankAccountController.revokeAccess);

export default router;
