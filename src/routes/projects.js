const express = require('express');
const router = express.Router();

// TODO: Implement project management routes
// - GET /api/projects - List projects
// - GET /api/projects/:id - Get project by ID
// - POST /api/projects - Create project
// - PUT /api/projects/:id - Update project
// - DELETE /api/projects/:id - Delete project

router.get('/', (req, res) => {
  res.json({ message: 'Projects route - Implementation pending' });
});

module.exports = router;
