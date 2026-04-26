import { Router } from 'express';
import { SnapshotController } from '../controllers/snapshot.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// Create snapshot from a group
router.post('/', SnapshotController.create);

// Get all snapshots (mine + shared)
router.get('/', SnapshotController.getAll);

// Get snapshot by ID
router.get('/:id', SnapshotController.getById);

// Update snapshot metadata (name, description)
router.put('/:id', SnapshotController.update);

// Delete snapshot
router.delete('/:id', SnapshotController.delete);

// Get transactions for snapshot
router.get('/:id/transactions', SnapshotController.getTransactions);

// Get totals for snapshot
router.get('/:id/totals', SnapshotController.getTotals);

// Add / remove transaction
router.post(
  '/:id/transactions/:transactionId',
  SnapshotController.addTransaction,
);
router.delete(
  '/:id/transactions/:transactionId',
  SnapshotController.removeTransaction,
);

// Get collaborators list
router.get('/:id/collaborators', SnapshotController.getCollaborators);

// Add / remove collaborator
router.post('/:id/collaborators', SnapshotController.addCollaborator);
router.delete(
  '/:id/collaborators/:collaboratorId',
  SnapshotController.removeCollaborator,
);

export default router;
