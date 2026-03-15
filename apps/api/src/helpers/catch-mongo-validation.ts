import { Response } from 'express';

export function catchMongoValidation(
  error: Error & { errors: any },
  res: Response,
) {
  if (error.name === 'ValidationError') {
    res.status(400).json({ error: 'Validation failed', details: error.errors });
  } else {
    res
      .status(500)
      .json({ error: 'Internal server error', message: error.message });
  }
}
