const express = require('express');
const bcrypt = require('bcrypt');
const database = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const users = await database.query(
      'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users'
    });
  }
});

/**
 * POST /api/users
 * Create a new user (admin only)
 */
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters'
      });
    }

    if (password.length < 12) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 12 characters'
      });
    }

    // Validate role
    const validRoles = ['admin', 'user'];
    const userRole = validRoles.includes(role) ? role : 'user';

    // Check if username already exists
    const existing = await database.get(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await database.run(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, userRole]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: result.id,
        username,
        role: userRole
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

/**
 * PUT /api/users/:id
 * Update a user (admin only)
 */
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, password, role } = req.body;

    // Check if user exists
    const user = await database.get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent self-demotion from admin
    if (req.user.id === userId && user.role === 'admin' && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own admin role'
      });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (username && username !== user.username) {
      // Check if new username already exists
      const existing = await database.get(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );

      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      updates.push('username = ?');
      params.push(username);
    }

    if (password) {
      if (password.length < 12) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 12 characters'
        });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      updates.push('password_hash = ?');
      params.push(passwordHash);
    }

    if (role) {
      const validRoles = ['admin', 'user'];
      if (validRoles.includes(role)) {
        updates.push('role = ?');
        params.push(role);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(userId);
    await database.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user (admin only)
 */
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent self-deletion
    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user exists
    const user = await database.get('SELECT id FROM users WHERE id = ?', [userId]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user
    await database.run('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

module.exports = router;
