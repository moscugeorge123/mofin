import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../database/models/user';
import { catchMongoValidation } from '../helpers/catch-mongo-validation';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export class UserController {
  // Register a new user
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        timezone,
        locale,
        currency,
      } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'User already exists' });
        return;
      }

      const user = new UserModel({
        firstName,
        lastName,
        email,
        password,
        timezone: timezone || 'UTC',
        locale: locale || 'en-US',
        currency: currency || 'USD',
      });

      await user.save();

      // Generate token
      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
      });

      res.status(201).json({
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Login user
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Find user with password field
      const user = await UserModel.findOne({ email }).select(
        '+password +isLocked +lockUntil +failedLoginAttempts',
      );

      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        res
          .status(423)
          .json({ error: 'Account is locked. Please try again later.' });
        return;
      }

      // Check if account is active
      if (!user.isActive) {
        res.status(403).json({ error: 'Account is inactive' });
        return;
      }

      // Compare password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        await user.incrementFailedLogins();
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Reset failed login attempts
      await user.resetFailedLogins();

      // Update last login
      user.lastLoginAt = new Date();
      user.lastLoginIp = req.ip;
      await user.save();

      // Generate token
      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
      });

      res.json({
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const updates = req.body;

      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Prevent updating sensitive fields
      delete updates.password;
      delete updates.email;
      delete updates.role;
      delete updates.isActive;
      delete updates.isLocked;
      delete updates.failedLoginAttempts;

      Object.assign(user, updates);
      await user.save();

      res.json(user);
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Change password
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { currentPassword, newPassword } = req.body;

      const user = await UserModel.findById(userId).select('+password');

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Request password reset
  static async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { email } = req.body;

      const user = await UserModel.findByEmail(email);

      if (!user) {
        // Don't reveal if user exists
        res.json({
          message: 'If the email exists, a reset link will be sent',
        });
        return;
      }

      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // TODO: Send email with reset token
      // In production, send email instead of returning token
      res.json({
        message: 'Password reset token generated',
        resetToken, // Remove this in production
      });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }

  // Delete user account (soft delete)
  static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      user.deletedAt = new Date();
      user.isActive = false;
      await user.save();

      res.json({ message: 'Account deleted successfully' });
    } catch (error: any) {
      catchMongoValidation(error, res);
    }
  }
}
