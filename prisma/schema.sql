-- THEA Database Schema for MySQL
-- This file contains the complete database schema for the THEA platform

-- Create database
CREATE DATABASE IF NOT EXISTS thea_db_neo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE thea_db_neo;

-- Enums (MySQL doesn't support native enums like PostgreSQL, so we'll use VARCHAR with constraints)
-- UserRole: ADMIN, ACCOUNTANT, VERIFIER
-- InvoiceStatus: PENDING, PAID, OVERDUE
-- InvoiceType: SALE, PURCHASE
-- VerificationStatus: AUTO_APPROVED, MANUAL_VERIFICATION_NEEDED, VERIFIED, REJECTED
-- ValuationMethod: FIFO, LIFO, WEIGHTED_AVERAGE, SPECIFIC_IDENTIFICATION

-- Create tables
CREATE TABLE enterprises (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(100) UNIQUE NOT NULL,
    country VARCHAR(100) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    invitation_code VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tax_id (tax_id),
    INDEX idx_invitation_code (invitation_code)
);

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'ACCOUNTANT', 'VERIFIER') DEFAULT 'ACCOUNTANT',
    phone VARCHAR(20),
    address TEXT,
    specialty VARCHAR(255),
    encrypted_pii TEXT,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    enterprise_id VARCHAR(36) NOT NULL,
    created_by_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_enterprise_id (enterprise_id),
    INDEX idx_role (role)
);

CREATE TABLE clients (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    specialty VARCHAR(255),
    enterprise_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    
    INDEX idx_enterprise_id (enterprise_id),
    INDEX idx_name (name)
);

CREATE TABLE suppliers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    income DECIMAL(15,2) DEFAULT 0.00,
    outcome DECIMAL(15,2) DEFAULT 0.00,
    specialty VARCHAR(255),
    bi_annotations TEXT,
    enterprise_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    
    INDEX idx_enterprise_id (enterprise_id),
    INDEX idx_name (name)
);

CREATE TABLE projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    bi_annotations TEXT,
    enterprise_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    
    INDEX idx_enterprise_id (enterprise_id),
    INDEX idx_name (name)
);

CREATE TABLE invoices (
    id VARCHAR(36) PRIMARY KEY,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status ENUM('PENDING', 'PAID', 'OVERDUE') DEFAULT 'PENDING',
    type ENUM('SALE', 'PURCHASE') NOT NULL,
    scan_url TEXT,
    extracted_data JSON,
    verification_status ENUM('AUTO_APPROVED', 'MANUAL_VERIFICATION_NEEDED', 'VERIFIED', 'REJECTED') DEFAULT 'MANUAL_VERIFICATION_NEEDED',
    digital_signature VARCHAR(255),
    enterprise_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36),
    supplier_id VARCHAR(36),
    project_id VARCHAR(36),
    created_by_id VARCHAR(36) NOT NULL,
    processed_by_id VARCHAR(36),
    verified_by_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (processed_by_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_enterprise_id (enterprise_id),
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_verification_status (verification_status),
    INDEX idx_created_by (created_by_id)
);

CREATE TABLE invoice_layouts (
    id VARCHAR(36) PRIMARY KEY,
    layout_data JSON NOT NULL,
    field_coordinates JSON NOT NULL,
    template_hash VARCHAR(255) UNIQUE NOT NULL,
    invoice_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_template_hash (template_hash)
);

CREATE TABLE company_stocks (
    id VARCHAR(36) PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 0,
    unit_price DECIMAL(15,2) NOT NULL,
    total_value DECIMAL(15,2) NOT NULL,
    reorder_threshold INT DEFAULT 10,
    valuation_method ENUM('FIFO', 'LIFO', 'WEIGHTED_AVERAGE', 'SPECIFIC_IDENTIFICATION') DEFAULT 'FIFO',
    enterprise_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    
    INDEX idx_enterprise_id (enterprise_id),
    INDEX idx_item_name (item_name)
);

CREATE TABLE metrics (
    id VARCHAR(36) PRIMARY KEY,
    financial_summary JSON NOT NULL,
    chart_configs JSON NOT NULL,
    enterprise_id VARCHAR(36) NOT NULL,
    project_id VARCHAR(36),
    company_stock_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (company_stock_id) REFERENCES company_stocks(id) ON DELETE SET NULL,
    
    INDEX idx_enterprise_id (enterprise_id),
    INDEX idx_project_id (project_id)
);

CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    log_event_type ENUM(
        'USER_LOGIN', 'USER_LOGOUT', 'INVOICE_CREATED', 'INVOICE_UPDATED', 
        'INVOICE_DELETED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
        'ENTERPRISE_CREATED', 'ENTERPRISE_UPDATED', 'CLIENT_CREATED', 
        'CLIENT_UPDATED', 'SUPPLIER_CREATED', 'SUPPLIER_UPDATED', 
        'PROJECT_CREATED', 'PROJECT_UPDATED', 'STOCK_UPDATED', 'AUDIT_LOG_ACCESSED'
    ) NOT NULL,
    version_hash VARCHAR(255) NOT NULL,
    immutable BOOLEAN DEFAULT TRUE,
    enterprise_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    invoice_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    
    INDEX idx_enterprise_id (enterprise_id),
    INDEX idx_user_id (user_id),
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_log_event_type (log_event_type),
    INDEX idx_created_at (created_at)
);

-- Create indexes for better performance
CREATE INDEX idx_invoices_enterprise_status ON invoices(enterprise_id, status);
CREATE INDEX idx_invoices_enterprise_verification ON invoices(enterprise_id, verification_status);
CREATE INDEX idx_users_enterprise_role ON users(enterprise_id, role);
CREATE INDEX idx_audit_logs_enterprise_event ON audit_logs(enterprise_id, log_event_type);

-- Insert default enterprise for development
INSERT INTO enterprises (id, name, tax_id, country, currency, address, phone, city, postal_code, invitation_code) 
VALUES (
    'dev-enterprise-001',
    'THEA Development Enterprise',
    'DEV-TAX-001',
    'United States',
    'USD',
    '123 Development Street',
    '+1-555-0123',
    'San Francisco',
    '94105',
    'DEV-INVITE-001'
);

-- Insert default admin user
INSERT INTO users (id, username, email, password_hash, role, enterprise_id) 
VALUES (
    'dev-admin-001',
    'admin',
    'admin@thea.dev',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.sm6', -- password: admin123
    'ADMIN',
    'dev-enterprise-001'
);
