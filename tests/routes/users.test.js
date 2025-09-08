const request = require('supertest');
const express = require('express');

// Create test app
const app = express();
app.use(express.json());

// Import and use the users route
const usersRoutes = require('../../src/routes/users');
app.use('/api/users', usersRoutes);

describe('Users Routes', () => {
  it('should return placeholder message for GET /', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);

    expect(response.body).toEqual({
      message: 'Users route - Implementation pending'
    });
  });
});