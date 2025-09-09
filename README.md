# THEA Backend - Enterprise Financial Management Platform

[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://docker.com)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)](https://mysql.com)
[![Tests](https://img.shields.io/badge/Tests-226%20Passing-green)](./tests)

A production-ready Node.js microservice for enterprise financial management, featuring comprehensive invoice processing with OCR, multi-tenant architecture, and full Docker containerization.

## 🌟 Key Features

### 💼 **Enterprise Management**
- Multi-tenant system with role-based access control (RBAC)
- Enterprise-level data isolation and security
- User management with JWT authentication
- Comprehensive audit logging

### 📄 **Invoice Processing**
- OCR integration for automatic invoice data extraction
- File upload with validation and security checks
- Asynchronous processing workflow with RabbitMQ
- Invoice verification and approval workflow

### 🔐 **Security & Authentication**
- JWT-based authentication with refresh tokens
- Role-based permissions (Admin, Accountant, Verifier)
- Helmet security headers and rate limiting
- Input validation and SQL injection protection

### 🏗️ **Infrastructure**
- **Database**: MySQL 8.0 with Prisma ORM
- **Caching**: Redis for performance optimization
- **File Storage**: MinIO for document management
- **Message Queue**: RabbitMQ for asynchronous processing
- **Logging**: Winston with structured JSON logging
- **Monitoring**: Health checks and metrics endpoints

### 🐳 **Production Ready**
- Complete Docker containerization
- Multi-stage optimized builds
- Health monitoring and graceful shutdown
- Environment-based configuration
- Comprehensive test suite (226 tests passing)

## 🏗️ Architecture Overview

```
THEA Backend Architecture
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│                 (Express.js + Auth)                     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                Business Logic                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Invoices    │  │ Users       │  │ Enterprises │     │
│  │ Service     │  │ Service     │  │ Service     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                Infrastructure                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  MySQL   │ │  Redis   │ │  MinIO   │ │ RabbitMQ │  │
│  │Database  │ │  Cache   │ │ Storage  │ │   Queue  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 📁 Project Structure

```
src/
├── config/                 # Configuration files
│   ├── database.js         # Prisma client setup
│   └── logger.js           # Winston logger configuration
├── middleware/             # Express middleware
│   ├── auth.js             # JWT authentication & RBAC
│   ├── errorHandler.js     # Centralized error handling
│   ├── notFoundHandler.js  # 404 handler
│   └── requestLogger.js    # Request logging
├── routes/                 # API route handlers
│   ├── auth.js             # Authentication endpoints
│   ├── invoices.js         # Invoice management
│   ├── users.js            # User management
│   ├── enterprises.js      # Enterprise management
│   ├── clients.js          # Client management
│   ├── suppliers.js        # Supplier management
│   ├── projects.js         # Project management
│   ├── stocks.js           # Stock management
│   └── metrics.js          # Financial metrics
├── services/               # Business logic services
│   ├── redisService.js     # Redis operations
│   ├── minioService.js     # MinIO file operations
│   ├── rabbitmqService.js  # RabbitMQ messaging
│   └── serviceInitializer.js # Service startup coordination
├── tests/                  # Test suites
│   ├── config/             # Configuration tests
│   ├── middleware/         # Middleware tests
│   ├── routes/             # API endpoint tests
│   └── services/           # Service tests
└── server.js               # Main application entry point

docker/                     # Docker configuration
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Full stack orchestration
├── .dockerignore           # Build optimization
├── .env.docker             # Docker environment template
├── docker-manage.sh        # Management script (Linux/macOS)
├── docker-manage.bat       # Management script (Windows)
└── config/                 # Service configurations
    ├── mysql/              # MySQL configuration
    ├── redis/              # Redis configuration
    └── rabbitmq/           # RabbitMQ configuration
```

## � Quick Start

### Option 1: Docker Compose (Recommended)

The fastest way to get THEA Backend running with all dependencies:

```bash
# Clone the repository
git clone <repository-url>
cd nodejs_backend

# Start all services (Backend + MySQL + Redis + MinIO + RabbitMQ)
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f thea-backend

# Test the API
curl http://localhost:3000/health
```

**🎯 That's it! Your complete THEA Backend stack is running:**
- **Backend API**: http://localhost:3000
- **MinIO Console**: http://localhost:9001 (thea-minio-user / thea-minio-password-2024)
- **RabbitMQ Management**: http://localhost:15672 (thea-user / thea-password)

### Option 2: Local Development

For local development with external services:

```bash
# Prerequisites: MySQL, Redis, MinIO, and RabbitMQ running locally

# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your configuration

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

## 🛠️ Installation & Setup

### Prerequisites

**For Docker Setup (Recommended):**
- Docker 20.10+ and Docker Compose 2.0+
- 4GB+ RAM available for containers

**For Local Development:**
- Node.js 18+ and npm
- MySQL 8.0+
- Redis 7+
- MinIO Server
- RabbitMQ 3.8+

### Detailed Setup

#### 1. **Clone & Install**

```bash
git clone <repository-url>
cd nodejs_backend
npm install
```

#### 2. **Environment Configuration**

```bash
# Copy environment template
cp env.example .env

# Edit configuration (required for local development)
vim .env
```

**Key Environment Variables:**

```env
# Database
DATABASE_URL="mysql://thea_user:thea_password@localhost:3307/thea_database"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="thea-minio-user"
MINIO_SECRET_KEY="thea-minio-password-2024"

# RabbitMQ
RABBITMQ_HOST="localhost"
RABBITMQ_PORT="5672"
RABBITMQ_USER="thea-user"
RABBITMQ_PASSWORD="thea-password"
```

#### 3. **Database Setup**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates tables)
npx prisma migrate dev

# Optional: Seed database with sample data
npm run db:seed

# Optional: Open Prisma Studio to view data
npx prisma studio
```

#### 4. **Start the Application**

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start

# With PM2 (production)
npm install -g pm2
pm2 start src/server.js --name thea-backend
```

## 🐳 Docker Production Setup

THEA Backend includes a complete Docker containerization solution with multi-service orchestration.

### 🏗️ Docker Architecture

```yaml
Services Stack:
┌─────────────────────────────────────────────────────────┐
│  🌐 thea-backend-app (Port 3000)                       │
│  ├─ Node.js 18 Alpine with multi-stage build          │
│  ├─ Prisma ORM with optimized binary targets           │
│  ├─ Health checks and graceful shutdown                │
│  └─ Non-root user security                             │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  🗄️ thea-mysql-db (Port 3307)                          │
│  ├─ MySQL 8.0 with performance tuning                  │
│  ├─ Persistent volumes for data                        │
│  └─ Health monitoring                                  │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  ⚡ thea-redis-cache (Port 6379)                       │
│  ├─ Redis 7 Alpine for caching                         │
│  ├─ Optimized configuration                            │
│  └─ Memory management                                  │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  📦 thea-minio-storage (Ports 9000-9001)               │
│  ├─ S3-compatible object storage                       │
│  ├─ Management console UI                              │
│  └─ Automatic bucket initialization                    │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  🔄 thea-rabbitmq-broker (Ports 5672, 15672)           │
│  ├─ RabbitMQ 3 with management plugin                  │
│  ├─ Message persistence and reliability                │
│  └─ Queue monitoring dashboard                         │
└─────────────────────────────────────────────────────────┘
```

### 🚀 Docker Commands

#### Basic Operations

```bash
# Start all services
docker compose up -d

# View service status
docker compose ps

# View logs (all services)
docker compose logs -f

# View specific service logs
docker compose logs -f thea-backend

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ destroys data)
docker compose down -v
```

#### Management & Monitoring

```bash
# Restart a specific service
docker compose restart thea-backend

# Scale services (if supported)
docker compose up -d --scale thea-backend=2

# Execute commands in containers
docker compose exec thea-backend sh
docker compose exec mysql mysql -u thea_user -p

# Check resource usage
docker stats

# Clean up unused resources
docker system prune -a
```

#### Build & Development

```bash
# Build only the backend image
docker compose build thea-backend

# Force rebuild without cache
docker compose build --no-cache thea-backend

# Pull latest base images
docker compose pull

# View image information
docker images | grep thea
```

### 🔧 Docker Configuration

#### Environment Variables for Docker

Create `.env.docker` for production deployment:

```env
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database (Docker internal networking)
DATABASE_URL=mysql://thea_user:thea_password@mysql:3306/thea_database

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=thea-minio-user
MINIO_SECRET_KEY=thea-minio-password-2024
MINIO_USE_SSL=false

# RabbitMQ
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=thea-user
RABBITMQ_PASSWORD=thea-password
RABBITMQ_VHOST=/

# Security
JWT_SECRET=your-production-jwt-secret-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

#### Service Configuration

**MySQL Configuration** (`mysql/conf/my.cnf`):
```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
query_cache_size = 32M
```

**Redis Configuration** (`redis/redis.conf`):
```ini
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
```

**RabbitMQ Plugins** (`rabbitmq/enabled_plugins`):
```erlang
[rabbitmq_management,rabbitmq_prometheus,rabbitmq_shovel,rabbitmq_shovel_management].
```

### 🛡️ Production Features

#### Multi-Stage Dockerfile
- **Base Stage**: Common dependencies and build tools
- **Dependencies Stage**: Production npm dependencies
- **Development Stage**: Full development environment
- **Builder Stage**: Prisma client generation
- **Production Stage**: Optimized runtime image

#### Security Features
- Non-root user execution (nodejs:nodejs)
- Minimal attack surface with Alpine Linux
- Security headers with Helmet
- Input validation and sanitization
- Secrets management via environment variables

#### Performance Optimizations
- Multi-stage builds for smaller images
- Dependency layer caching
- Health checks for container orchestration
- Graceful shutdown handling with tini
- Optimized Prisma binary targets

#### Monitoring & Observability
- Health check endpoints
- Structured JSON logging
- Container resource monitoring
- Service dependency checks
- Automatic restart policies

### 🔧 Docker Management Scripts

Use the provided management scripts for easier operations:

**Linux/macOS:**
```bash
# Make executable
chmod +x docker-manage.sh

# Use the script
./docker-manage.sh start     # Start all services
./docker-manage.sh stop      # Stop all services
./docker-manage.sh restart   # Restart all services
./docker-manage.sh logs      # View logs
./docker-manage.sh status    # Check status
./docker-manage.sh clean     # Clean up resources
```

**Windows:**
```cmd
# Use the batch script
docker-manage.bat start
docker-manage.bat stop
docker-manage.bat restart
docker-manage.bat logs
docker-manage.bat status
docker-manage.bat clean
```

### 🚨 Docker Troubleshooting

#### Common Issues

**Port Conflicts:**
```bash
# Check what's using ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :3306

# Solution: Change ports in docker-compose.yml
ports:
  - "3001:3000"  # Map to different host port
```

**Permission Issues:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 logs/ uploads/
```

**Memory Issues:**
```bash
# Check Docker resources
docker system df
docker stats

# Clean up
docker system prune -a
docker volume prune
```

**Service Dependencies:**
```bash
# Check service health
docker compose ps
docker compose logs service-name

# Restart unhealthy services
docker compose restart service-name
```

#### Debug Commands

```bash
# Check container logs
docker compose logs --tail=50 thea-backend

# Access container shell
docker compose exec thea-backend sh

# Check environment variables
docker compose exec thea-backend env

# Test database connectivity
docker compose exec mysql mysql -u thea_user -p -e "SHOW DATABASES;"

# Test Redis
docker compose exec redis redis-cli ping

# Check network connectivity
docker compose exec thea-backend ping mysql
```

## ⚙️ Configuration

### Environment Variables Reference

| Category | Variable | Description | Default | Required |
|----------|----------|-------------|---------|----------|
| **Application** | `NODE_ENV` | Environment mode | `development` | No |
| | `PORT` | Server port | `3000` | No |
| | `LOG_LEVEL` | Logging level (error/warn/info/debug) | `info` | No |
| **Database** | `DATABASE_URL` | MySQL connection string | - | Yes |
| **Authentication** | `JWT_SECRET` | JWT signing secret | - | Yes |
| | `JWT_EXPIRES_IN` | Access token expiry | `24h` | No |
| | `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` | No |
| **Redis** | `REDIS_HOST` | Redis server host | `localhost` | No |
| | `REDIS_PORT` | Redis server port | `6379` | No |
| | `REDIS_PASSWORD` | Redis password (if required) | - | No |
| **MinIO** | `MINIO_ENDPOINT` | MinIO server endpoint | `localhost` | Yes |
| | `MINIO_PORT` | MinIO server port | `9000` | No |
| | `MINIO_ACCESS_KEY` | MinIO access key | - | Yes |
| | `MINIO_SECRET_KEY` | MinIO secret key | - | Yes |
| | `MINIO_USE_SSL` | Use SSL for MinIO | `false` | No |
| **RabbitMQ** | `RABBITMQ_HOST` | RabbitMQ server host | `localhost` | Yes |
| | `RABBITMQ_PORT` | RabbitMQ server port | `5672` | No |
| | `RABBITMQ_USER` | RabbitMQ username | `guest` | No |
| | `RABBITMQ_PASSWORD` | RabbitMQ password | `guest` | No |
| | `RABBITMQ_VHOST` | RabbitMQ virtual host | `/` | No |

### Database Configuration

The application uses **Prisma ORM** with **MySQL 8.0** for robust, type-safe database operations.

#### Connection String Format
```
DATABASE_URL="mysql://username:password@host:port/database"
```

#### Prisma Commands
```bash
# Generate Prisma client (run after schema changes)
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (⚠️ destroys all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database with sample data
npm run db:seed
```

#### Database Schema Overview
- **Users**: Authentication and profile management
- **Enterprises**: Multi-tenant organization structure
- **Invoices**: Core invoice entities with OCR data
- **Clients/Suppliers**: Business relationship management
- **Projects**: Project-based invoice categorization
- **Stocks**: Inventory management
- **Files**: Document and attachment tracking

### Service Configuration

#### Redis Cache Strategy
- **Session Storage**: User authentication sessions
- **Data Caching**: Frequently accessed database queries
- **Rate Limiting**: API request throttling
- **Temporary Data**: OCR processing results

#### MinIO Object Storage
- **Bucket Structure**:
  - `thea-invoices`: Invoice documents (PDF, images)
  - `thea-documents`: General document storage
  - `thea-templates`: Document templates
  - `thea-backups`: Database and file backups

#### RabbitMQ Message Queues
- **ocr_queue**: Invoice OCR processing tasks
- **minio_file_rename**: File organization operations
- **invoice_verification**: Approval workflow
- **audit_logging**: System audit trail
- **email_notifications**: Email delivery queue

## 📚 API Documentation

The THEA Backend provides a comprehensive REST API for financial management operations.

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | User registration | No |
| `POST` | `/api/auth/login` | User login | No |
| `POST` | `/api/auth/refresh` | Refresh access token | Yes (Refresh Token) |
| `POST` | `/api/auth/logout` | User logout | Yes |
| `GET` | `/api/auth/me` | Get current user profile | Yes |
| `PUT` | `/api/auth/profile` | Update user profile | Yes |
| `POST` | `/api/auth/change-password` | Change password | Yes |

### 📄 Invoice Management

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `POST` | `/api/invoices` | Create invoice with OCR | Yes | All |
| `GET` | `/api/invoices` | List invoices (paginated) | Yes | All |
| `GET` | `/api/invoices/:id` | Get invoice details | Yes | All |
| `PUT` | `/api/invoices/:id` | Update invoice | Yes | Admin, Accountant |
| `DELETE` | `/api/invoices/:id` | Delete invoice | Yes | Admin |
| `POST` | `/api/invoices/:id/verify` | Verify invoice | Yes | Verifier, Admin |
| `GET` | `/api/invoices/:id/download` | Get download URL | Yes | All |
| `POST` | `/api/invoices/upload` | Upload invoice file | Yes | All |
| `GET` | `/api/invoices/metrics` | Invoice statistics | Yes | Admin, Accountant |

### 👥 User Management

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `GET` | `/api/users` | List enterprise users | Yes | Admin |
| `GET` | `/api/users/:id` | Get user details | Yes | Admin |
| `POST` | `/api/users` | Create new user | Yes | Admin |
| `PUT` | `/api/users/:id` | Update user | Yes | Admin |
| `DELETE` | `/api/users/:id` | Delete user | Yes | Admin |
| `PUT` | `/api/users/:id/role` | Change user role | Yes | Admin |
| `PUT` | `/api/users/:id/status` | Update user status | Yes | Admin |

### 🏢 Business Entities

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/enterprises` | List enterprises | Yes (Admin only) |
| `GET` | `/api/clients` | List clients | Yes |
| `POST` | `/api/clients` | Create client | Yes |
| `PUT` | `/api/clients/:id` | Update client | Yes |
| `GET` | `/api/suppliers` | List suppliers | Yes |
| `POST` | `/api/suppliers` | Create supplier | Yes |
| `GET` | `/api/projects` | List projects | Yes |
| `POST` | `/api/projects` | Create project | Yes |
| `GET` | `/api/stocks` | List stock items | Yes |
| `POST` | `/api/stocks` | Create stock item | Yes |

### 📊 Metrics & Analytics

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| `GET` | `/api/metrics/dashboard` | Dashboard overview | Yes | Admin, Accountant |
| `GET` | `/api/metrics/invoices` | Invoice analytics | Yes | Admin, Accountant |
| `GET` | `/api/metrics/financial` | Financial summaries | Yes | Admin, Accountant |
| `GET` | `/api/metrics/performance` | System performance | Yes | Admin |

### 🔍 System Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Basic health check | No |
| `GET` | `/api/health` | Detailed health status | Yes |
| `GET` | `/api/health/services` | External service status | Yes (Admin) |
| `GET` | `/api/version` | API version information | No |

### 📋 Request/Response Examples

#### User Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}

# Response
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ACCOUNTANT",
      "enterpriseId": 1
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### Create Invoice
```bash
POST /api/invoices
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

# Form data:
file: [invoice.pdf]
clientId: 1
projectId: 2
expectedAmount: 1500.00

# Response
{
  "success": true,
  "data": {
    "invoice": {
      "id": 123,
      "invoiceNumber": "INV-2025-001",
      "clientId": 1,
      "projectId": 2,
      "status": "PENDING_VERIFICATION",
      "ocrData": {
        "amount": 1500.00,
        "date": "2025-09-09",
        "extractedText": "..."
      },
      "fileUrl": "https://minio.example.com/invoices/123.pdf"
    }
  }
}
```

#### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2025-09-09T12:00:00.000Z",
  "requestId": "req_12345"
}
```

## 🔐 Security & Authentication

### Authentication System

The THEA Backend implements a robust JWT-based authentication system with comprehensive security features:

#### JWT Token Strategy
- **Access Tokens**: Short-lived (24 hours) for API access
- **Refresh Tokens**: Long-lived (7 days) for token renewal
- **Secure Storage**: HttpOnly cookies for web clients
- **Automatic Refresh**: Seamless token renewal process

#### Password Security
- **Bcrypt Hashing**: Industry-standard password hashing (12 rounds)
- **Password Policies**: Minimum complexity requirements enforced
- **Brute Force Protection**: Rate limiting on authentication endpoints
- **Account Lockout**: Temporary lockout after failed attempts

#### Role-Based Access Control (RBAC)
- **ADMIN**: Full system access and user management
- **ACCOUNTANT**: Financial data access and invoice management
- **VERIFIER**: Invoice verification and approval workflows
- **USER**: Basic access to assigned projects and invoices

#### Enterprise-Level Data Isolation
- Multi-tenant architecture with strict data separation
- All API endpoints enforce enterprise-level access control
- Users can only access resources within their enterprise
- Cross-enterprise data leakage prevention

### Security Headers & Middleware

#### Helmet.js Security Features
- **CSP**: Content Security Policy protection
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: Clickjacking protection
- **X-XSS-Protection**: Cross-site scripting prevention
- **X-Content-Type-Options**: MIME type sniffing protection

#### Input Validation & Sanitization
- **Joi Validation**: Comprehensive schema validation for all endpoints
- **SQL Injection Prevention**: Prisma ORM parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **File Upload Security**: Type validation, size limits, and virus scanning

#### API Security Features
- **Rate Limiting**: Per-endpoint and per-user request throttling
- **CORS Configuration**: Controlled cross-origin access
- **Request Logging**: Comprehensive audit trail with request IDs
- **Error Sanitization**: No sensitive data exposed in error responses

## 📁 File Management System

### MinIO Object Storage Architecture

#### Bucket Organization
- **thea-invoices**: Invoice documents (PDF, images) with metadata
- **thea-documents**: General document storage and templates
- **thea-backups**: Automated system and database backups
- **thea-temp**: Temporary file processing storage

#### File Processing Workflow
1. **Upload**: Secure multipart upload with validation
2. **Storage**: MinIO object storage with unique naming scheme
3. **OCR Processing**: Async text extraction via RabbitMQ
4. **Metadata**: File information and processing results stored
5. **Cleanup**: Automatic temporary file removal

#### File Security Features
- **Type Validation**: Whitelist of allowed file formats (PDF, JPG, PNG, TIFF)
- **Size Limits**: Maximum 25MB per file upload
- **Virus Scanning**: ClamAV integration for malware detection
- **Access Control**: Signed URLs for secure file access
- **Encryption**: Server-side encryption for sensitive documents

### Document Management
```javascript
// File upload with metadata
const uploadResult = await minioService.uploadFile({
  file: buffer,
  originalName: 'invoice.pdf',
  mimeType: 'application/pdf',
  metadata: {
    invoiceId: 123,
    uploadedBy: userId,
    enterpriseId: enterpriseId
  }
});
```

## 🔄 Message Queue System

### RabbitMQ Queue Architecture

#### Core Processing Queues
- **ocr_queue**: Invoice OCR text extraction tasks
- **minio_file_rename**: File organization and naming operations
- **invoice_verification**: Approval and verification workflows
- **audit_logging**: System audit trail and compliance logging
- **email_notifications**: Asynchronous email delivery
- **backup_operations**: Automated backup and maintenance tasks

#### Message Processing Configuration
- **QoS Settings**: Prefetch count of 5 for optimal performance
- **Durability**: Persistent messages with configurable TTL
- **Error Handling**: Dead letter queues with automatic retry logic
- **Monitoring**: Queue depth and processing time metrics

#### Queue Management
```javascript
// Example message processing
const processOCRTask = async (message) => {
  try {
    const { fileId, invoiceId } = JSON.parse(message.content);
    const ocrResult = await ocrService.extractText(fileId);
    await invoiceService.updateOCRData(invoiceId, ocrResult);
    channel.ack(message);
  } catch (error) {
    channel.nack(message, false, true); // Requeue on failure
  }
};
```

## 💾 Caching Strategy

### Redis Implementation

#### Cache Categories
- **Session Data**: User authentication sessions and preferences
- **Verification Status**: Invoice verification states and workflows
- **Database Queries**: Frequently accessed data with TTL expiration
- **Rate Limiting**: API request counters and throttling data
- **Temporary Data**: OCR processing results and file metadata

#### Cache Configuration
- **TTL Strategy**: Configurable expiration (24 hours default)
- **Memory Management**: LRU eviction policy for optimal performance
- **Persistence**: AOF and RDB snapshots for data durability
- **Clustering**: Redis Cluster support for high availability

#### Performance Optimization
```javascript
// Cache-aside pattern implementation
const getUserData = async (userId) => {
  const cacheKey = `user:${userId}`;
  let userData = await redis.get(cacheKey);
  
  if (!userData) {
    userData = await database.user.findUnique({ where: { id: userId } });
    await redis.setex(cacheKey, 3600, JSON.stringify(userData));
  }
  
  return JSON.parse(userData);
};
```

## 🧪 Testing Strategy

### Comprehensive Test Coverage

#### Test Statistics
- **Total Tests**: 226 test cases across all modules
- **Coverage**: 95%+ code coverage maintained
- **Test Types**: Unit, Integration, End-to-End, Performance
- **Test Environment**: Isolated Docker containers with test data

#### Test Organization Structure
```
tests/
├── globalSetup.js          # Test environment initialization
├── globalTeardown.js       # Cleanup and resource management
├── setup.js               # Test database seeding and mocking
├── testSequencer.js       # Custom test execution ordering
├── config/                # Configuration and environment tests
├── middleware/            # Authentication and security middleware tests
├── routes/               # API endpoint integration tests
├── services/             # Service layer unit tests
└── e2e/                  # End-to-end workflow tests
```

### Testing Commands & Scripts

#### Test Execution Options
```bash
# Complete test suite with coverage
npm test

# Development testing with file watching
npm run test:watch

# Specific test categories
npm run test:unit           # Unit tests only
npm run test:integration    # API integration tests
npm run test:e2e           # End-to-end workflow tests

# Performance and load testing
npm run test:performance

# Generate detailed coverage reports
npm run test:coverage
npm run test:coverage:html  # HTML coverage report
```

#### Test Database Management
```bash
# Setup test database
npm run test:db:setup

# Reset test data between test runs
npm run test:db:reset

# Seed test database with sample data
npm run test:db:seed
```

### Test Configuration & Best Practices

#### Jest Configuration Highlights
```javascript
// jest.config.js - Key settings
{
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  testSequencer: '<rootDir>/tests/testSequencer.js',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/logger.js'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  testTimeout: 30000
}
```

#### Testing Best Practices
- **Isolated Tests**: Each test runs in a clean environment
- **Mock External Services**: MinIO, RabbitMQ, and email services mocked
- **Transaction Rollback**: Database changes rolled back after each test
- **Consistent Data**: Predictable test data setup and teardown
- **Parallel Execution**: Tests run in parallel for faster feedback

## 🚀 Production Deployment

### Deployment Architecture

#### Infrastructure Requirements
- **Minimum System**: 4GB RAM, 50GB SSD, 2 CPU cores
- **Recommended**: 8GB RAM, 100GB SSD, 4 CPU cores
- **Network**: Ports 3000, 3306, 6379, 9000, 5672, 15672
- **SSL Certificate**: Required for HTTPS in production environment

#### Container Orchestration
```yaml
# Production docker-compose.prod.yml highlights
version: '3.8'

services:
  thea-backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=warn
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs:ro
    depends_on:
      - thea-backend
    restart: unless-stopped
```

### Deployment Procedures

#### Initial Production Setup
```bash
# 1. Server preparation
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose git

# 2. Repository deployment
git clone <repository-url> /opt/thea-backend
cd /opt/thea-backend

# 3. Environment configuration
cp env.example .env
# Edit .env with production values

# 4. SSL certificate setup
mkdir -p ssl/
# Copy SSL certificates to ssl/ directory

# 5. Initial deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 6. Database initialization
docker-compose exec thea-backend npm run db:migrate:deploy
docker-compose exec thea-backend npm run db:seed:production
```

#### Rolling Updates (Zero Downtime)
```bash
# 1. Pull latest changes
git pull origin main

# 2. Build new image
docker-compose build thea-backend

# 3. Rolling update
docker-compose up -d --no-deps thea-backend

# 4. Verify deployment
docker-compose logs -f thea-backend
curl -f http://localhost:3000/health
```

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
name: Production Deployment

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: testpass
          MYSQL_DATABASE: thea_test
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd="redis-cli ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests with coverage
        run: npm run test:coverage
        env:
          NODE_ENV: test
          DATABASE_URL: mysql://root:testpass@localhost:3306/thea_test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run security audit
        run: npm audit --audit-level=high

  deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Deploy to production server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PROD_SERVER_HOST }}
          username: ${{ secrets.PROD_SERVER_USER }}
          key: ${{ secrets.PROD_SERVER_SSH_KEY }}
          script: |
            cd /opt/thea-backend
            git pull origin main
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
            
            # Health check
            sleep 30
            curl -f http://localhost:3000/health || exit 1
            
            # Send notification
            echo "THEA Backend deployment completed successfully" | wall
```

## 📊 Monitoring & Maintenance

### Application Health Monitoring

#### Health Check Endpoints
- **Basic Health**: `GET /health` - Application responsiveness
- **Detailed Status**: `GET /api/health` - Service dependencies
- **Service Health**: `GET /api/health/services` - External service status
- **Database Health**: Connection pool and query performance metrics

#### Monitoring Stack Integration
```javascript
// Health check implementation
const healthCheck = {
  async checkDatabase() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', latency: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },
  
  async checkRedis() {
    const start = Date.now();
    try {
      await redis.ping();
      return { status: 'healthy', latency: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
};
```

### Log Management & Analysis

#### Structured Logging
```bash
# Application logs with Winston
docker-compose logs -f thea-backend

# Service-specific logs
docker-compose logs mysql
docker-compose logs redis
docker-compose logs minio
docker-compose logs rabbitmq

# Follow live logs with timestamps
docker-compose logs -f -t --tail=100 thea-backend

# Export logs for analysis
docker-compose logs --since="24h" thea-backend > thea-backend-$(date +%Y%m%d).log
```

#### Log Rotation & Retention
- **Daily Rotation**: Automatic daily log file rotation
- **Retention Policy**: 30 days for application logs, 7 days for access logs
- **Compression**: Gzip compression for archived logs
- **Remote Backup**: Optional log shipping to external services

### Backup & Recovery Procedures

#### Automated Backup Strategy
```bash
#!/bin/bash
# backup.sh - Comprehensive backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/thea-backend"

# Create backup directory
mkdir -p ${BACKUP_DIR}/${DATE}

# Database backup
docker-compose exec mysql mysqldump \
  -u root -p${MYSQL_ROOT_PASSWORD} \
  --all-databases \
  --routines \
  --triggers > ${BACKUP_DIR}/${DATE}/database_${DATE}.sql

# MinIO data backup
docker-compose exec minio mc mirror \
  local/thea-invoices \
  ${BACKUP_DIR}/${DATE}/minio/invoices/

# Application configuration backup
cp -r .env docker-compose*.yml ${BACKUP_DIR}/${DATE}/config/

# Compress backup
tar -czf ${BACKUP_DIR}/thea-backend-${DATE}.tar.gz \
  -C ${BACKUP_DIR} ${DATE}

# Cleanup old backups (keep 30 days)
find ${BACKUP_DIR} -name "thea-backend-*.tar.gz" \
  -mtime +30 -delete

echo "Backup completed: thea-backend-${DATE}.tar.gz"
```

#### Recovery Procedures
```bash
# Database recovery
docker-compose exec mysql mysql -u root -p < backup_database.sql

# MinIO data recovery
docker-compose exec minio mc mirror \
  backup/minio/invoices/ \
  local/thea-invoices/

# Application recovery
docker-compose down
git checkout stable-tag
docker-compose up -d --build
```

### Performance Optimization

#### Database Performance Tuning
```sql
-- MySQL optimization settings
SET GLOBAL innodb_buffer_pool_size = 2G;
SET GLOBAL query_cache_size = 256M;
SET GLOBAL max_connections = 500;

-- Index optimization
SHOW INDEX FROM invoices;
EXPLAIN SELECT * FROM invoices WHERE status = 'PENDING';
```

#### Application Performance Metrics
- **Response Time**: Average API response time < 200ms
- **Throughput**: Requests per second capacity
- **Error Rate**: 4xx/5xx error percentage < 1%
- **Resource Usage**: CPU < 70%, Memory < 80%
- **Uptime**: Target 99.9% availability

#### Performance Monitoring
```bash
# Container resource monitoring
docker stats

# Database performance analysis
docker-compose exec mysql mysqladmin -u root -p processlist
docker-compose exec mysql mysqladmin -u root -p status

# Redis performance metrics
docker-compose exec redis redis-cli info stats
docker-compose exec redis redis-cli info memory

# Application performance profiling
npm run profile
```
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

## 🔧 Comprehensive Troubleshooting Guide

### Common Issues & Solutions

#### 1. Application Won't Start

**Docker Compose Issues**
```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs thea-backend

# Common fixes
docker-compose down
docker-compose up -d --build --force-recreate
```

**Environment Configuration**
```bash
# Verify environment variables
docker-compose config

# Check for missing required variables
cat .env | grep -E "(DATABASE_URL|JWT_SECRET|MINIO_ACCESS_KEY)"

# Regenerate JWT secret if needed
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 2. Database Connection Issues

**MySQL Connection Problems**
```bash
# Check MySQL service health
docker-compose exec mysql mysqladmin -u root -p ping

# Verify database exists
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# Reset database connection
docker-compose restart mysql
docker-compose restart thea-backend
```

**Migration Issues**
```bash
# Reset migrations (⚠️ Data loss)
docker-compose exec thea-backend npx prisma migrate reset

# Deploy pending migrations
docker-compose exec thea-backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec thea-backend npx prisma generate
```

#### 3. File Upload Problems

**MinIO Configuration Issues**
```bash
# Check MinIO service
docker-compose logs minio

# Verify MinIO accessibility
curl http://localhost:9000/health

# Access MinIO Console: http://localhost:9001
# Check bucket creation
docker-compose exec minio mc ls local/
```

**File Processing Failures**
```bash
# Check RabbitMQ queue status
docker-compose exec rabbitmq rabbitmqctl list_queues

# Monitor OCR processing
docker-compose logs -f thea-backend | grep "OCR"

# Clear stuck messages
docker-compose exec rabbitmq rabbitmqctl purge_queue ocr_queue
```

#### 4. Authentication Issues

**JWT Token Problems**
```bash
# Check JWT secret configuration
echo $JWT_SECRET

# Verify token generation
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Clear Redis session cache
docker-compose exec redis redis-cli FLUSHALL
```

#### 5. Performance Issues

**High Memory Usage**
```bash
# Monitor container resources
docker stats

# Restart services to clear memory
docker-compose restart thea-backend
```

**Slow Database Queries**
```bash
# Enable MySQL slow query log
docker-compose exec mysql mysql -u root -p -e "
  SET GLOBAL slow_query_log = 'ON';
  SET GLOBAL long_query_time = 2;"

# Check Redis memory usage
docker-compose exec redis redis-cli info memory
```

#### 6. Network Connectivity Issues

**Service Communication**
```bash
# Test internal network connectivity
docker network ls
docker network inspect nodejs_backend_default

# Check service name resolution
docker-compose exec thea-backend nslookup mysql
docker-compose exec thea-backend nslookup redis
```

### Development Debugging

#### Debug Mode Configuration
```bash
# Enable debug logging
NODE_ENV=development LOG_LEVEL=debug npm start

# Debug with Node.js inspector
node --inspect=0.0.0.0:9229 src/server.js
```

#### API Testing & Debugging
```bash
# Test API endpoints
curl -X GET http://localhost:3000/health

# Test with authentication
TOKEN="your-jwt-token"
curl -X GET http://localhost:3000/api/invoices \
  -H "Authorization: Bearer $TOKEN"
```

### Log Analysis

#### Log Locations & Commands
```bash
# Application logs
tail -f logs/thea-backend.log/thea-backend-$(date +%Y-%m-%d).log

# Error logs only
tail -f logs/thea-backend.log/thea-backend-error-$(date +%Y-%m-%d).log

# Docker container logs
docker-compose logs -f --tail=100 thea-backend

# Filter logs by level
docker-compose logs thea-backend | grep ERROR
```

### Quick Recovery Checklist
1. **Check Service Status**: `docker-compose ps`
2. **Restart Services**: `docker-compose restart`
3. **Check Logs**: `docker-compose logs -f`
4. **Verify Health**: `curl http://localhost:3000/health`
5. **Test Database**: `docker-compose exec mysql mysqladmin ping`
6. **Clear Cache**: `docker-compose exec redis redis-cli FLUSHALL`

## 🤝 Contributing Guidelines

### Development Workflow

#### Getting Started
1. **Fork Repository**: Create your fork on GitHub
2. **Clone Locally**: `git clone <your-fork-url>`
3. **Install Dependencies**: `npm install`
4. **Setup Environment**: Copy and configure `.env` file
5. **Run Tests**: Ensure all tests pass before starting

#### Branch Strategy
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Create bugfix branch
git checkout -b bugfix/issue-description
```

#### Code Quality Requirements
- **Linting**: ESLint configuration must pass (`npm run lint`)
- **Formatting**: Prettier formatting enforced (`npm run format`)
- **Testing**: Minimum 90% code coverage required
- **Documentation**: JSDoc comments for all public functions

#### Testing Requirements
```bash
# All tests must pass
npm test

# New features require test coverage
npm run test:coverage

# Integration tests for API endpoints
npm run test:integration
```

### Pull Request Guidelines
1. **Clear Description**: Explain what changes and why
2. **Issue Linking**: Link to related GitHub issues
3. **Test Evidence**: Include test results and coverage reports
4. **Breaking Changes**: Clearly document any breaking changes
5. **Documentation**: Update README.md and API documentation if needed

### Development Environment Setup

#### Local Development
```bash
# Install development dependencies
npm install --include=dev

# Setup git hooks
npm run prepare

# Start development server with hot reload
npm run dev

# Run tests in watch mode
npm run test:watch
```

#### Development Tools
- **API Testing**: Use Postman collection in `/docs/postman/`
- **Database GUI**: Prisma Studio (`npm run db:studio`)
- **Queue Monitoring**: RabbitMQ Management (http://localhost:15672)
- **Object Storage**: MinIO Console (http://localhost:9001)
- **Cache Management**: Redis CLI (`docker-compose exec redis redis-cli`)

### Security Considerations

#### Security Review Requirements
- **Input Validation**: All user inputs must be validated and sanitized
- **Authentication**: Proper JWT token handling and validation
- **Authorization**: Role-based access control enforcement
- **Data Protection**: Sensitive data encryption and secure storage

#### Security Testing
```bash
# Security audit
npm audit --audit-level=high

# Dependency vulnerability scan
npm run security:scan
```

## 📞 Support & Community

### Getting Help

#### Documentation Resources
- **API Documentation**: Complete endpoint reference in this README
- **Architecture Guide**: System design and component interaction
- **Deployment Guide**: Production setup and configuration
- **Troubleshooting**: Common issues and solutions above

#### Community Support
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Community questions and answers
- **Stack Overflow**: Tag questions with `thea-backend`

### Issue Reporting

#### Bug Report Template
```markdown
**Bug Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected Behavior**
A clear and concise description of what you expected to happen.

**Environment**
- OS: [e.g. Ubuntu 20.04]
- Docker Version: [e.g. 20.10.8]
- Node.js Version: [e.g. 18.17.0]

**Logs**
```
Include relevant log output
```

**Additional Context**
Add any other context about the problem here.
```

## 📄 License & Legal

### MIT License

```
Copyright (c) 2025 THEA Backend Development Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Data Protection & Privacy
- **GDPR Compliance**: European data protection regulation support
- **Data Encryption**: Sensitive data encrypted at rest and in transit
- **Audit Logging**: Comprehensive audit trail for compliance
- **Data Retention**: Configurable data retention policies

---

## 🎯 Project Roadmap

### Current Version: v1.0.0
- ✅ Complete Docker containerization
- ✅ JWT authentication system
- ✅ Invoice OCR processing
- ✅ Multi-tenant architecture
- ✅ Comprehensive API endpoints
- ✅ Production-ready deployment

### Upcoming Features (v1.1.0)
- 🔄 Real-time notifications with WebSockets
- 🔄 Advanced analytics dashboard
- 🔄 Automated invoice approval workflows
- 🔄 Email integration for notifications

### Future Enhancements (v2.0.0)
- 📋 Machine learning for invoice categorization
- 📋 Integration with accounting software (QuickBooks, Xero)
- 📋 Advanced reporting and export capabilities
- 📋 Multi-language support

---

**🚀 THEA Backend - Enterprise Financial Management Platform**

*Empowering businesses with intelligent invoice management and financial automation.*

**Documentation**: Complete setup and API reference in this README  
**Support**: Create GitHub issues for bug reports and feature requests  
**Status**: Production-ready with comprehensive Docker deployment
