# THEA - Backend Microservice DevSecOps Platform

![Thea Architecture](./DevSecOps%20diagramme.png)

## Table of Contents
- [Introduction](#introduction)
- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Key Components](#key-components)
- [Getting Started](#getting-started)
- [Services](#services)
  - [Node.js Backend](#nodejs-backend)
  - [FastAPI OCR Service](#fastapi-ocr-service)
  - [Chatbot Microservice](#chatbot-microservice)
- [Data Model](#data-model)
- [Database & ORM](#database--orm)
- [AI/ML Implementation](#aiml-implementation)
- [DevSecOps Implementation](#devsecops-implementation)
- [Infrastructure Setup](#infrastructure-setup)
- [Security Features](#security-features)
- [Monitoring & Observability](#monitoring--observability)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Thea is an enterprise-grade financial management platform born from a comprehensive requirements study focused on business management needs and intelligent invoice processing. The project addresses the critical demands of modern enterprises for efficient financial operations, document management, and intelligent automation.

The requirements study identified several key needs in the financial management space:

1. **Enterprise Management**: A centralized system for managing organizational structures, users, and permissions
2. **Smart Invoice Scanning**: Automated extraction of data from invoices to eliminate manual data entry
3. **Financial Workflow**: End-to-end tracking of financial documents from receipt to payment
4. **Security & Compliance**: Robust security measures and audit trails for financial operations
5. **Real-time Assistance**: Intelligent support for users navigating financial processes

Thea addresses these requirements through a microservice architecture with integrated DevSecOps practices, ensuring security, scalability, and maintainability throughout the application lifecycle.

## Project Overview

Thea is a comprehensive microservice-based backend system with integrated DevSecOps practices. The platform provides enterprise-grade accounting and invoice management capabilities with AI-powered OCR processing and real-time chatbot assistance.

### Key Features

- **Enterprise Management**: Multi-tenant system for managing organizations, users, and permissions
- **Invoice Processing**: Automated OCR scanning and data extraction for invoices
- **Financial Management**: Track clients, suppliers, projects, and stock
- **Secure Architecture**: End-to-end security with encryption and audit logging
- **DevSecOps Integration**: Continuous integration, delivery, and security monitoring

## System Architecture

Thea follows a microservice architecture with three primary services:

1. **Node.js Backend**: Core business logic and API endpoints
2. **FastAPI OCR Service**: AI-powered invoice scanning and data extraction
3. **Chatbot Microservice**: Real-time assistance via WebSocket communication

These services are supported by several infrastructure components:

- **MySQL Database**: Primary data store (via XAMPP for development)
- **Redis**: Caching and session management
- **MinIO**: Object storage for document management
- **RabbitMQ**: Message queuing for asynchronous processing

![Critical Workflow](./Thea%20Critical%20Workflow.png)

## Key Components

### Business Entities
- **Enterprise**: Organization entity with users, clients, invoices
- **User**: System users with role-based access (ADMIN, ACCOUNTANT, VERIFIER)
- **Invoice**: Core document with OCR extraction and verification workflow
- **Client/Supplier**: External business entities
- **Project/Stock**: Resource management

### Infrastructure Components
- **MinIO Storage**: Document storage and management
- **Redis Cache**: Performance optimization and session storage
- **RabbitMQ**: Asynchronous message processing
- **Audit Logging**: Security and compliance tracking

### AI/ML Components
- **OCR Processing**: Automated document scanning and data extraction
- **Layout Recognition**: Template matching for invoice formats
- **Chatbot**: Real-time assistance with Redis-backed caching

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- MySQL 8.0+ (XAMPP recommended for development)
- Docker and Docker Compose (for containerized deployment)
- MinIO Server
- Redis Server
- RabbitMQ Server

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/FediMechergui/Thea_Backend_Microservice_DevSecOps.git
   cd Thea_Backend_Microservice_DevSecOps
   ```

2. **Set up Node.js Backend**
   ```bash
   cd nodejs_backend
   npm install
   cp .env.example .env  # Configure your environment variables
   npx prisma migrate dev
   npm run dev
   ```

3. **Set up FastAPI OCR Service**
   ```bash
   cd fastapi_backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

4. **Set up Chatbot Microservice**
   ```bash
   cd chatbot_microservice
   npm install
   cp .env.example .env  # Configure your environment variables
   npm run dev
   ```

5. **Set up Infrastructure Services**
   - Follow the instructions in `VirtualBox_Setup_Guide.md` for the complete infrastructure setup
   - For local development, you can use Docker Compose (configuration provided in the deploying directory)

## Services

### Node.js Backend

The Node.js backend is the core service handling business logic, authentication, and data management.

#### Key Features
- RESTful API with Express.js
- Prisma ORM for MySQL database access
- JWT-based authentication with role-based access control
- MinIO integration for document storage
- RabbitMQ for asynchronous processing
- Redis for caching and session management
- Winston for structured logging

#### API Endpoints
- `/api/auth`: Authentication and user management
- `/api/users`: User operations
- `/api/enterprises`: Enterprise management
- `/api/clients`: Client management
- `/api/suppliers`: Supplier management
- `/api/projects`: Project management
- `/api/stocks`: Inventory management
- `/api/invoices`: Invoice processing and management

#### Configuration
The Node.js backend is configured via environment variables in the `.env` file:
- Database connection (MySQL)
- JWT secrets and expiration
- Redis connection
- RabbitMQ connection
- MinIO configuration
- FastAPI OCR service URL

### FastAPI OCR Service

The FastAPI OCR service provides AI-powered document scanning and data extraction capabilities.

#### Key Features
- REST API with FastAPI
- OCR processing for invoice scanning
- Layout detection and template matching
- Confidence scoring for verification workflow

#### API Endpoints
- `/process`: Process invoice scan and extract data
- `/health`: Service health check

#### Configuration
The FastAPI service is configured via environment variables:
- OCR confidence threshold
- Service port and host settings

### Chatbot Microservice

The Chatbot microservice provides real-time assistance via WebSocket communication.

#### Key Features
- WebSocket server for real-time communication
- Redis-based answer caching
- Session management
- Health check endpoint

#### Configuration
The Chatbot service is configured via environment variables:
- Redis connection
- WebSocket port
- Cache TTL settings

## Data Model

Thea uses a comprehensive data model implemented with Prisma ORM:

![Class Diagram](./THEA%20Class%20Diagram%20final%20full.png)

### Core Entities

#### Enterprise
```
- id: String
- name: String
- taxId: String
- country: String
- currency: String
- address: String
- phone: String
- city: String
- postalCode: String
- invitationCode: String
```

#### User
```
- id: String
- username: String
- email: String
- passwordHash: String
- role: UserRole (ADMIN, ACCOUNTANT, VERIFIER)
- encryptedPii: String
- phone: String
- address: String
- specialty: String
```

#### Invoice
```
- id: String
- invoiceDate: DateTime
- dueDate: DateTime
- totalAmount: Decimal
- currency: String
- status: InvoiceStatus (PENDING, PAID, OVERDUE)
- type: InvoiceType (SALE, PURCHASE)
- scanUrl: String
- extractedData: Json
- verificationStatus: VerificationStatus
- digitalSignature: String
```

#### InvoiceLayout
```
- id: String
- layoutData: Json
- fieldCoordinates: Json
- templateHash: String
```

Additional entities include Client, Supplier, Project, CompanyStock, AuditLog, and Metric.

## Database & ORM

Thea uses Prisma ORM as its primary database access layer, providing type-safe database queries, migrations, and schema management.

### Prisma ORM

Prisma offers several advantages for the Thea platform:

1. **Type Safety**: Automatically generated TypeScript types based on the database schema
2. **Migration Management**: Version-controlled database schema changes
3. **Query Building**: Intuitive API for building complex database queries
4. **Relationship Handling**: Simplified management of database relationships
5. **Transaction Support**: ACID-compliant database operations

### Database Relationships

The database schema implements complex relationships between entities:

1. **Enterprise-Centric Design**:
   - An Enterprise is the top-level entity that owns all other resources
   - One-to-many relationship with Users, Clients, Suppliers, Projects, Invoices, and other entities
   - Enforces multi-tenant data isolation

2. **User Management**:
   - Users belong to a single Enterprise
   - Role-based access control (ADMIN, ACCOUNTANT, VERIFIER)
   - Users can create sub-accounts and verify invoices

3. **Invoice Processing Workflow**:
   - Invoices are linked to Enterprises, Clients/Suppliers, and Projects
   - Each Invoice uses an InvoiceLayout for OCR processing
   - Verification workflow with status tracking
   - Digital signatures for non-repudiation

4. **Financial Relationships**:
   - Clients and Suppliers are linked to Invoices
   - Projects track related financial documents
   - CompanyStock manages inventory with valuation methods

5. **Audit and Metrics**:
   - AuditLog tracks all user actions with immutable records
   - Metrics aggregate financial data for reporting

### Database Technology

The system uses MySQL as the primary database, with XAMPP providing a convenient development environment. The production environment can be migrated to managed MySQL services or other compatible databases supported by Prisma.

## AI/ML Implementation

Thea incorporates several AI/ML models to power its intelligent features:

### OCR and Document Understanding

1. **Computer Vision Models**:
   - Document layout analysis for invoice structure recognition
   - Text detection and recognition with confidence scoring
   - Field extraction based on spatial coordinates

2. **Natural Language Processing**:
   - Named entity recognition for vendor, client, and product identification
   - Information extraction for invoice details (dates, amounts, line items)
   - Text classification for document type identification

3. **Machine Learning Pipeline**:
   - Template matching for known invoice layouts
   - Confidence scoring for verification workflow
   - Continuous learning from manual corrections

### Chatbot Intelligence

1. **Retrieval-Augmented Generation (RAG)**:
   - Context-aware responses based on enterprise data
   - Database-backed information retrieval
   - Natural language understanding for user queries

2. **Session Management**:
   - Conversation context tracking
   - User intent recognition
   - Redis-backed response caching

The AI models are implemented in the FastAPI backend using Python-based machine learning libraries, with the current implementation providing mock responses for testing and development purposes. The production system is designed to integrate with more sophisticated models as needed.

## DevSecOps Implementation

Thea implements a comprehensive DevSecOps workflow with security integrated throughout the entire development lifecycle:

### Complete DevSecOps Cycle

1. **Plan & Requirements**:
   - Security requirements defined at project inception
   - Threat modeling and risk assessment
   - Compliance requirements identification

2. **Development**:
   - Secure coding guidelines
   - Pre-commit hooks for security checks
   - Peer code reviews with security focus

3. **Build & Integration**:
   - Jenkins-driven CI/CD pipeline
   - SonarQube for static application security testing (SAST)
   - Snyk for software composition analysis (SCA)
   - Dependency vulnerability scanning

4. **Testing**:
   - Automated security testing
   - Unit and integration tests with security scenarios
   - API security testing

5. **Deployment**:
   - Trivy for container scanning
   - Infrastructure as Code security validation
   - Secure configuration management
   - Blue-green deployment for zero downtime

6. **Operations**:
   - Infrastructure scanning with Nessus
   - Application scanning with OWASP ZAP
   - Runtime application self-protection
   - Continuous monitoring and alerting

7. **Monitoring & Feedback**:
   - Prometheus for metrics collection
   - Grafana for visualization
   - Alertmanager for notifications
   - Security incident response process
   - Feedback loop to development

This end-to-end DevSecOps approach ensures security is built into every phase of the application lifecycle, not just added as an afterthought.

## Infrastructure Setup

The infrastructure is designed for high availability and security:

### VM Specifications
- CI/CD Server: Ubuntu 22.04, 4 CPU, 8GB RAM
- Monitoring Server: Ubuntu 22.04, 2 CPU, 4GB RAM
- Security Server: Kali Linux, 4 CPU, 8GB RAM
- Load Balancer: Ubuntu 22.04, 2 CPU, 2GB RAM
- App Servers (x2): Ubuntu 22.04, 8 CPU, 16GB RAM
- Backup Server: Ubuntu 22.04, 4 CPU, 4GB RAM, 500GB storage

### Network Configuration
- Application Network: 192.168.1.0/24
- Management Network: 10.0.2.0/24

Detailed setup instructions are available in the `VirtualBox_Setup_Guide.md` file.

## Security Features

Thea implements multiple layers of security:

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- PII encryption

### Data Security
- TLS for all communications
- Encrypted sensitive data
- Audit logging for all operations
- Digital signatures for invoices

### Infrastructure Security
- Network segmentation
- Vulnerability scanning
- Container security
- Compliance monitoring

## Monitoring & Observability

Thea provides comprehensive monitoring and observability:

### Metrics
- API performance (response time, error rate)
- Data store performance (connection pool, query latency)
- Security metrics (CVEs, scan frequency)

### Alerting
- Critical alerts via PagerDuty and SMS
- High-priority alerts via email and Slack
- Medium-priority alerts via Slack

### Logging
- Structured logging with Winston
- Centralized log collection
- Audit trail for compliance

## Development Workflow

### Branching Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- Feature branches: For new features
- Hotfix branches: For urgent fixes

### Code Review Process
- Pull request required for all changes
- Automated tests must pass
- Security scan must pass
- Code review by at least one team member

## Testing

Thea implements comprehensive testing:

### Unit Testing
- Jest for Node.js backend
- Pytest for FastAPI service

### Integration Testing
- API endpoint testing with Supertest
- Service integration testing

### Security Testing
- SAST with SonarQube
- DAST with OWASP ZAP
- Penetration testing

## API Documentation

API documentation is available via:
- Swagger UI for FastAPI service
- Postman collection for Node.js backend
- API reference documentation

## Deployment

Thea supports multiple deployment options:

### Docker Deployment
- Docker Compose for local development
- Kubernetes for production

### VM Deployment
- Ansible playbooks for provisioning
- Blue-green deployment for zero downtime

## Contributing

Please read the CONTRIBUTING.md file for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
