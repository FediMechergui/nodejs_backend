const request = require('supertest');
const express = require('express');

// Create test app
const app = express();
app.use(express.json());

// Import and use the metrics route
const metricsRoutes = require('../../src/routes/metrics');
app.use('/api/metrics', metricsRoutes);

describe('Metrics Routes', () => {
  it('should return placeholder message for GET /', async () => {
    const response = await request(app)
      .get('/api/metrics')
      .expect(200);

    expect(response.body).toEqual({
      message: 'Metrics route - Implementation pending'
    });
  });
});