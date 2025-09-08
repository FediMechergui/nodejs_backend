const request = require('supertest');
const express = require('express');

// Create test app
const app = express();
app.use(express.json());

// Import and use the clients route
const clientsRoutes = require('../../src/routes/clients');
app.use('/api/clients', clientsRoutes);

describe('Clients Routes', () => {
  it('should return placeholder message for GET /', async () => {
    const response = await request(app)
      .get('/api/clients')
      .expect(200);

    expect(response.body).toEqual({
      message: 'Clients route - Implementation pending'
    });
  });
});