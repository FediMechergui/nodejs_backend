const request = require('supertest');
const express = require('express');
const { notFoundHandler } = require('../../src/middleware/notFoundHandler');

// Create test app
const app = express();

// Add a test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route' });
});

// Add the not found handler
app.use(notFoundHandler);

describe('Not Found Handler Middleware', () => {
  it('should return 404 for non-existent route', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Route not found');
    expect(response.body.error.statusCode).toBe(404);
    expect(response.body.error.path).toBe('/non-existent-route');
    expect(response.body.error.method).toBe('GET');
    expect(response.body.error.timestamp).toBeDefined();
    expect(response.body.error.availableRoutes).toBeDefined();
    expect(Array.isArray(response.body.error.availableRoutes)).toBe(true);
  });

  it('should return 404 for POST to non-existent route', async () => {
    const response = await request(app)
      .post('/non-existent-route')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Route not found');
    expect(response.body.error.statusCode).toBe(404);
    expect(response.body.error.path).toBe('/non-existent-route');
    expect(response.body.error.method).toBe('POST');
  });

  it('should return 404 for PUT to non-existent route', async () => {
    const response = await request(app)
      .put('/non-existent-route')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Route not found');
    expect(response.body.error.statusCode).toBe(404);
    expect(response.body.error.path).toBe('/non-existent-route');
    expect(response.body.error.method).toBe('PUT');
  });

  it('should return 404 for DELETE to non-existent route', async () => {
    const response = await request(app)
      .delete('/non-existent-route')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Route not found');
    expect(response.body.error.statusCode).toBe(404);
    expect(response.body.error.path).toBe('/non-existent-route');
    expect(response.body.error.method).toBe('DELETE');
  });

  it('should return 404 for PATCH to non-existent route', async () => {
    const response = await request(app)
      .patch('/non-existent-route')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Route not found');
    expect(response.body.error.statusCode).toBe(404);
    expect(response.body.error.path).toBe('/non-existent-route');
    expect(response.body.error.method).toBe('PATCH');
  });

  it('should include available routes in response', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);

    expect(response.body.error.availableRoutes).toContain('/health');
    expect(response.body.error.availableRoutes).toContain('/api/auth/*');
    expect(response.body.error.availableRoutes).toContain('/api/users/*');
    expect(response.body.error.availableRoutes).toContain('/api/enterprises/*');
    expect(response.body.error.availableRoutes).toContain('/api/clients/*');
    expect(response.body.error.availableRoutes).toContain('/api/suppliers/*');
    expect(response.body.error.availableRoutes).toContain('/api/projects/*');
    expect(response.body.error.availableRoutes).toContain('/api/invoices/*');
    expect(response.body.error.availableRoutes).toContain('/api/stocks/*');
    expect(response.body.error.availableRoutes).toContain('/api/metrics/*');
  });

  it('should include timestamp in response', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);

    expect(response.body.error.timestamp).toBeDefined();
    expect(new Date(response.body.error.timestamp)).toBeInstanceOf(Date);
  });

  it('should not interfere with existing routes', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.body.message).toBe('Test route');
  });

  it('should handle nested non-existent routes', async () => {
    const response = await request(app)
      .get('/api/non-existent/nested/route')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Route not found');
    expect(response.body.error.path).toBe('/api/non-existent/nested/route');
  });

  it('should handle routes with query parameters', async () => {
    const response = await request(app)
      .get('/non-existent-route?param=value&other=test')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Route not found');
    expect(response.body.error.path).toBe('/non-existent-route?param=value&other=test');
  });

  it('should handle routes with hash fragments', async () => {
    const response = await request(app)
      .get('/non-existent-route#fragment')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe('Route not found');
    // Hash fragments are not sent to the server, so the path won't include the fragment
    expect(response.body.error.path).toBe('/non-existent-route');
  });
});
