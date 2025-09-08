const express = require('express');
const router = express.Router();

// TODO: Implement user management routes
// - GET /api/users - List users
// - GET /api/users/:id - Get user by ID
// - PUT /api/users/:id - Update user
// - DELETE /api/users/:id - Delete user
// - POST /api/users/:id/sub-accounts - Create sub-account

router.get('/', (req, res) => {
  res.json({ message: 'Users route - Implementation pending' });
});

module.exports = router;
