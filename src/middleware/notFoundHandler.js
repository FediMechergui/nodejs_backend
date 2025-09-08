/**
 * 404 Not Found Handler Middleware
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method,
      availableRoutes: [
        '/health',
        '/api/auth/*',
        '/api/users/*',
        '/api/enterprises/*',
        '/api/clients/*',
        '/api/suppliers/*',
        '/api/projects/*',
        '/api/invoices/*',
        '/api/stocks/*',
        '/api/metrics/*'
      ]
    }
  });
}

module.exports = { notFoundHandler };
