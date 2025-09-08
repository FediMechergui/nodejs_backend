const express = require('express');
const router = express.Router();

// TODO: Implement stock management routes
// - GET /api/stocks - List stock items
// - GET /api/stocks/:id - Get stock item by ID
// - POST /api/stocks - Create stock item
// - PUT /api/stocks/:id - Update stock item
// - DELETE /api/stocks/:id - Delete stock item

router.get('/', (req, res) => {
  res.json({ message: 'Stocks route - Implementation pending' });
});

module.exports = router;
