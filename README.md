# THEA Backend - Node.js Microservice

This is the core backend microservice for the THEA financial management platform, built with Node.js, Express, and Prisma ORM.

## 🚀 Features

- **Enterprise Management**: Multi-tenant system with role-based access control
- **Invoice Processing**: OCR integration with file upload and verification workflow
- **User Management**: Authentication with JWT tokens and role-based permissions
- **File Storage**: MinIO integration for document management
- **Message Queuing**: RabbitMQ for asynchronous processing
- **Caching**: Redis for performance optimization
- **Database**: MySQL with Prisma ORM for type-safe database operations
- **Security**: Helmet, rate limiting, and input validation
- **Logging**: Winston with structured logging and file rotation
- **Monitoring**: Health checks and metrics endpoints

## 🏗️ Architecture

```
src/
├── config/          # Configuration files
│   ├── database.js  # Prisma client setup
│   └── logger.js    # Winston logger configuration
├── middleware/      # Express middleware
│   ├── auth.js      # JWT authentication & RBAC
│   ├── errorHandler.js # Centralized error handling
│   ├── notFoundHandler.js # 404 handler
│   └── requestLogger.js # Request logging
├── routes/          # API route handlers
│   ├── auth.js      # Authentication endpoints
│   ├── invoices.js  # Invoice management
│   ├── users.js     # User management
│   └── ...          # Other entity routes
├── services/        # Business logic services
│   ├── redisService.js    # Redis operations
│   ├── minioService.js    # MinIO file operations
│   ├── rabbitmqService.js # RabbitMQ messaging
│   └── serviceInitializer.js # Service startup
└── server.js        # Main application entry point
```

## 📋 Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Redis 7+
- MinIO Server
- RabbitMQ 3.8+

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nodejs_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Option 1: Use Prisma (recommended)
   npx prisma generate
   npx prisma migrate dev
   
   # Option 2: Use raw SQL
   mysql -u root -p < prisma/schema.sql
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🐳 Docker Setup

### Quick Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f thea-backend

# Stop services
docker-compose down
```

### Individual Services

```bash
# Build the backend
docker build -t thea-backend .

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://root:password@host.docker.internal:3306/thea_db" \
  -e REDIS_HOST="host.docker.internal" \
  -e MINIO_ENDPOINT="host.docker.internal" \
  -e RABBITMQ_HOST="host.docker.internal" \
  thea-backend
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | MySQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `REDIS_HOST` | Redis server host | `localhost` |
| `MINIO_ENDPOINT` | MinIO server endpoint | `localhost` |
| `RABBITMQ_HOST` | RabbitMQ server host | `localhost` |

### Database Configuration

The application uses Prisma ORM with MySQL. Key configuration:

- **Connection**: Configure via `DATABASE_URL` environment variable
- **Schema**: Located in `prisma/schema.prisma`
- **Migrations**: Run with `npm run db:migrate`
- **Studio**: Access with `npm run db:studio`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### Invoices
- `POST /api/invoices` - Create invoice with OCR
- `GET /api/invoices` - List invoices (with pagination)
- `GET /api/invoices/:id` - Get invoice by ID
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/:id/verify` - Verify invoice
- `GET /api/invoices/:id/download` - Get download URL

### Other Entities
- `GET /api/users` - List users
- `GET /api/enterprises` - List enterprises
- `GET /api/clients` - List clients
- `GET /api/suppliers` - List suppliers
- `GET /api/projects` - List projects
- `GET /api/stocks` - List stock items
- `GET /api/metrics` - Get financial metrics

## 🔐 Authentication & Authorization

### JWT Tokens
- Access tokens expire in 24 hours (configurable)
- Refresh tokens expire in 7 days (configurable)
- Tokens include user ID, role, and enterprise ID

### Role-Based Access Control
- **ADMIN**: Full access to all resources
- **ACCOUNTANT**: Invoice and financial data access
- **VERIFIER**: Invoice verification and review access

### Enterprise Isolation
- Users can only access resources within their enterprise
- All API endpoints enforce enterprise-level data isolation

## 📁 File Management

### MinIO Integration
- **Buckets**: `thea-invoices`, `thea-documents`, `thea-templates`, `thea-backups`
- **File Types**: PDF, JPG, JPEG, PNG, TIFF
- **Max Size**: 25MB per file
- **Storage**: Object-based with metadata

### File Workflow
1. File uploaded to temporary storage
2. Stored in MinIO with unique naming
3. OCR processing triggered via RabbitMQ
4. File renamed after processing completion
5. Cleanup of temporary files

## 🔄 Message Queuing

### RabbitMQ Queues
- **ocr_queue**: Invoice OCR processing tasks
- **minio_file_rename**: File renaming operations
- **invoice_verification**: Verification workflow
- **audit_logging**: Audit trail processing
- **email_notifications**: Email delivery

### Message Processing
- **QoS**: Prefetch count of 5
- **Durability**: Persistent messages with TTL
- **Error Handling**: Automatic requeuing on failure

## 💾 Caching Strategy

### Redis Usage
- **Session Data**: User sessions and authentication
- **Verification Status**: Invoice verification state
- **Frequently Accessed Data**: Cached database queries
- **TTL**: Configurable expiration (default: 24 hours)

### Cache Operations
- **SET/GET**: Basic key-value operations
- **HSET/HGET**: Hash operations for complex data
- **TTL Management**: Automatic expiration
- **Invalidation**: Cache clearing on updates

## 📊 Monitoring & Health

### Health Endpoints
- `GET /health` - Basic health check
- `GET /api/health/services` - Service status
- `GET /api/health/database` - Database connectivity

### Logging
- **Levels**: Error, Warn, Info, Debug
- **Format**: Structured JSON with timestamps
- **Rotation**: Daily log files with compression
- **Storage**: Separate error and info logs

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=invoices
```

## 🚀 Development

### Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Code Quality
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (if configured)
- **Husky**: Git hooks for pre-commit checks

## 🔒 Security Features

- **Helmet**: Security headers
- **Rate Limiting**: Request throttling
- **Input Validation**: Request data sanitization
- **JWT Security**: Token-based authentication
- **CORS**: Cross-origin resource sharing
- **SQL Injection Protection**: Prisma ORM
- **File Upload Security**: Type and size validation

## 📈 Performance

- **Connection Pooling**: Database connection management
- **Caching**: Redis for frequently accessed data
- **Async Processing**: RabbitMQ for background tasks
- **File Streaming**: Efficient file upload/download
- **Query Optimization**: Prisma query optimization

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL service status
   - Verify connection string in `.env`
   - Ensure database exists

2. **Redis Connection Failed**
   - Check Redis service status
   - Verify host and port configuration
   - Check firewall settings

3. **MinIO Connection Failed**
   - Verify MinIO server is running
   - Check access key and secret
   - Ensure buckets exist

4. **RabbitMQ Connection Failed**
   - Check RabbitMQ service status
   - Verify credentials and vhost
   - Check port accessibility

### Logs
- **Application Logs**: `logs/thea-backend-YYYY-MM-DD.log`
- **Error Logs**: `logs/thea-backend-error-YYYY-MM-DD.log`
- **Console Output**: Development mode logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

---

**THEA Backend** - Enterprise Financial Management Platform
