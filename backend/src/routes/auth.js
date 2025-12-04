const express = require('express');
const bcrypt = require('bcrypt');
const database = require('../config/database');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with username and password
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Find user
    const user = await database.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      username: user.username
    });

    // Return success
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify JWT token
 */
router.post('/verify', authMiddleware, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal, server-side just confirms)
 */
router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await database.get(
      'SELECT id, username, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/auth/change-password
 * Change password for current user
 */
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters'
      });
    }

    // Get user
    const user = await database.get(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await database.run(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
