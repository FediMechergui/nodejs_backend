const express = require('express');
const router = express.Router();

// TODO: Implement supplier management routes
// - GET /api/suppliers - List suppliers
// - GET /api/suppliers/:id - Get supplier by ID
// - POST /api/suppliers - Create supplier
// - PUT /api/suppliers/:id - Update supplier
// - DELETE /api/suppliers/:id - Delete supplier

router.get('/', (req, res) => {
  res.json({ message: 'Suppliers route - Implementation pending' });
});

module.exports = router;
