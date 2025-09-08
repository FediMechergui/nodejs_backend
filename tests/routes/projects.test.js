const request = require('supertest');
const express = require('express');

// Create test app
const app = express();
app.use(express.json());

// Import and use the projects route
const projectsRoutes = require('../../src/routes/projects');
app.use('/api/projects', projectsRoutes);

describe('Projects Routes', () => {
  it('should return placeholder message for GET /', async () => {
    const response = await request(app)
      .get('/api/projects')
      .expect(200);

    expect(response.body).toEqual({
      message: 'Projects route - Implementation pending'
    });
  });
});