const request = require('supertest');
const express = require('express');

// Create test app
const app = express();
app.use(express.json());

// Import and use the suppliers route
const suppliersRoutes = require('../../src/routes/suppliers');
app.use('/api/suppliers', suppliersRoutes);

describe('Suppliers Routes', () => {
  it('should return placeholder message for GET /', async () => {
    const response = await request(app)
      .get('/api/suppliers')
      .expect(200);

    expect(response.body).toEqual({
      message: 'Suppliers route - Implementation pending'
    });
  });
});