const request = require('supertest');
const express = require('express');

// Create test app
const app = express();
app.use(express.json());

// Import and use the stocks route
const stocksRoutes = require('../../src/routes/stocks');
app.use('/api/stocks', stocksRoutes);

describe('Stocks Routes', () => {
  it('should return placeholder message for GET /', async () => {
    const response = await request(app)
      .get('/api/stocks')
      .expect(200);

    expect(response.body).toEqual({
      message: 'Stocks route - Implementation pending'
    });
  });
});