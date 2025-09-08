const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { logger } = require('../config/logger');
const { prisma } = require('../config/database');
const { authenticateToken, requireRole, requireEnterpriseAccess } = require('../middleware/auth');
const { uploadFile, getPresignedUrl, deleteFile } = require('../services/minioService');
const { publishMessage } = require('../services/rabbitmqService');
const { set, expire } = require('../services/redisService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_TEMP_DIR || 'uploads/temp';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 25 * 1024 * 1024, // 25MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png,tiff').split(',');
    const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

/**
 * @route   POST /api/invoices
 * @desc    Create a new invoice with OCR processing
 * @access  Private
 */
router.post('/', [
  authenticateToken,
  requireEnterpriseAccess,
  upload.single('invoiceFile'),
  body('invoiceDate').isISO8601(),
  body('dueDate').isISO8601(),
  body('totalAmount').isFloat({ min: 0 }),
  body('currency').isLength({ min: 3, max: 3 }),
  body('type').isIn(['SALE', 'PURCHASE']),
  body('clientId').optional().isUUID(),
  body('supplierId').optional().isUUID(),
  body('projectId').optional().isUUID()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invoice file is required'
        }
      });
    }

    const {
      invoiceDate,
      dueDate,
      totalAmount,
      currency,
      type,
      clientId,
      supplierId,
      projectId
    } = req.body;

    // Validate business logic
    if (type === 'SALE' && !clientId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Client ID is required for sale invoices'
        }
      });
    }

    if (type === 'PURCHASE' && !supplierId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Supplier ID is required for purchase invoices'
        }
      });
    }

    // Validate that client exists if clientId is provided
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true }
      });
      
      if (!client) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid client ID provided'
          }
        });
      }
    }

    // Validate that supplier exists if supplierId is provided
    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
        select: { id: true }
      });
      
      if (!supplier) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid supplier ID provided'
          }
        });
      }
    }

    // Generate temporary object name for MinIO
    const tempObjectName = `temp/${uuidv4()}-${Date.now()}${path.extname(req.file.originalname)}`;
    const bucketName = process.env.MINIO_BUCKET_NAME || 'thea-invoices';

    try {
      // Upload file to MinIO
      await uploadFile(bucketName, tempObjectName, req.file.path, {
        'content-type': req.file.mimetype,
        'original-name': req.file.originalname
      });

      // Get presigned URL for OCR processing
      const scanUrl = await getPresignedUrl(bucketName, tempObjectName, 900); // 15 minutes

      // Create invoice record
      const invoice = await prisma.invoice.create({
        data: {
          invoiceDate: new Date(invoiceDate),
          dueDate: new Date(dueDate),
          totalAmount: parseFloat(totalAmount),
          currency: currency.toUpperCase(),
          status: 'PENDING',
          type,
          scanUrl,
          verificationStatus: 'MANUAL_VERIFICATION_NEEDED',
          enterpriseId: req.user.enterpriseId,
          clientId: clientId || null,
          supplierId: supplierId || null,
          projectId: projectId || null,
          createdById: req.user.id
        },
        include: {
          client: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          createdBy: { select: { id: true, username: true } }
        }
      });

      // Publish OCR task to RabbitMQ
      const ocrTask = {
        invoiceId: invoice.id,
        fileUrl: scanUrl,
        enterpriseId: req.user.enterpriseId,
        tempObjectName,
        bucketName,
        originalFileName: req.file.originalname
      };

      await publishMessage('ocr_queue', ocrTask, { priority: 5 });

      // Store verification status in Redis
      const verificationKey = `verification:${invoice.id}`;
      await set(verificationKey, {
        status: 'PROCESSING',
        invoiceId: invoice.id,
        timestamp: new Date().toISOString()
      }, 86400); // 24 hours TTL

      // Clean up temporary file
      await fs.unlink(req.file.path);

      logger.info('Invoice created successfully', {
        invoiceId: invoice.id,
        enterpriseId: req.user.enterpriseId,
        userId: req.user.id,
        fileSize: req.file.size
      });

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: {
          invoice,
          ocrStatus: 'PROCESSING',
          message: 'Invoice uploaded and OCR processing started'
        }
      });

    } catch (error) {
      // Clean up on error
      try {
        await fs.unlink(req.file.path);
        if (tempObjectName) {
          await deleteFile(bucketName, tempObjectName);
        }
      } catch (cleanupError) {
        logger.error('Cleanup error:', cleanupError);
      }

      throw error;
    }

  } catch (error) {
    logger.error('Invoice creation failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create invoice'
      }
    });
  }
});

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices for the enterprise
 * @access  Private
 */
router.get('/', [
  authenticateToken,
  requireEnterpriseAccess
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      verificationStatus,
      startDate,
      endDate,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      enterpriseId: req.user.enterpriseId
    };

    if (status) where.status = status;
    if (type) where.type = type;
    if (verificationStatus) where.verificationStatus = verificationStatus;
    
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate);
      if (endDate) where.invoiceDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
        { project: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Get invoices with pagination
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          createdBy: { select: { id: true, username: true } },
          processedBy: { select: { id: true, username: true } },
          verifiedBy: { select: { id: true, username: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.invoice.count({ where })
    ]);

    const totalPages = Math.ceil(total / take);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Failed to get invoices:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get invoices'
      }
    });
  }
});

/**
 * @route   GET /api/invoices/:id
 * @desc    Get invoice by ID
 * @access  Private
 */
router.get('/:id', [
  authenticateToken,
  requireEnterpriseAccess
], async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        enterpriseId: req.user.enterpriseId
      },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        supplier: { select: { id: true, name: true, email: true, phone: true } },
        project: { select: { id: true, name: true, description: true } },
        createdBy: { select: { id: true, username: true } },
        processedBy: { select: { id: true, username: true } },
        verifiedBy: { select: { id: true, username: true } },
        invoiceLayouts: true
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Invoice not found'
        }
      });
    }

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    logger.error('Failed to get invoice:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get invoice'
      }
    });
  }
});

/**
 * @route   PUT /api/invoices/:id
 * @desc    Update invoice
 * @access  Private
 */
router.put('/:id', [
  authenticateToken,
  requireEnterpriseAccess,
  body('invoiceDate').optional().isISO8601(),
  body('dueDate').optional().isISO8601(),
  body('totalAmount').optional().isFloat({ min: 0 }),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('status').optional().isIn(['PENDING', 'PAID', 'OVERDUE']),
  body('verificationStatus').optional().isIn(['AUTO_APPROVED', 'MANUAL_VERIFICATION_NEEDED', 'VERIFIED', 'REJECTED'])
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // Convert date strings to Date objects
    if (updateData.invoiceDate) updateData.invoiceDate = new Date(updateData.invoiceDate);
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
    if (updateData.totalAmount) updateData.totalAmount = parseFloat(updateData.totalAmount);
    if (updateData.currency) updateData.currency = updateData.currency.toUpperCase();

    // Check if invoice exists and belongs to enterprise
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        enterpriseId: req.user.enterpriseId
      }
    });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Invoice not found'
        }
      });
    }

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } }
      }
    });

    logger.info('Invoice updated successfully', {
      invoiceId: id,
      enterpriseId: req.user.enterpriseId,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });

  } catch (error) {
    logger.error('Failed to update invoice:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update invoice'
      }
    });
  }
});

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Delete invoice
 * @access  Private (Admin only)
 */
router.delete('/:id', [
  authenticateToken,
  requireRole('ADMIN'),
  requireEnterpriseAccess
], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if invoice exists and belongs to enterprise
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        enterpriseId: req.user.enterpriseId
      },
      select: { scanUrl: true }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Invoice not found'
        }
      });
    }

    // Delete from MinIO if scanUrl exists
    if (invoice.scanUrl) {
      try {
        const urlParts = invoice.scanUrl.split('/');
        const objectName = urlParts[urlParts.length - 1];
        const bucketName = process.env.MINIO_BUCKET_NAME || 'thea-invoices';
        await deleteFile(bucketName, objectName);
      } catch (minioError) {
        logger.warn('Failed to delete file from MinIO:', minioError);
      }
    }

    // Delete from database
    await prisma.invoice.delete({
      where: { id }
    });

    logger.info('Invoice deleted successfully', {
      invoiceId: id,
      enterpriseId: req.user.enterpriseId,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete invoice:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete invoice'
      }
    });
  }
});

/**
 * @route   POST /api/invoices/:id/verify
 * @desc    Verify invoice (for VERIFIER role)
 * @access  Private
 */
router.post('/:id/verify', [
  authenticateToken,
  requireRole('VERIFIER', 'ADMIN'),
  requireEnterpriseAccess,
  body('verificationStatus').isIn(['VERIFIED', 'REJECTED']),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { id } = req.params;
    const { verificationStatus, notes } = req.body;

    // Check if invoice exists and belongs to enterprise
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        enterpriseId: req.user.enterpriseId
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Invoice not found'
        }
      });
    }

    // Update invoice verification status
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        verificationStatus,
        verifiedById: req.user.id
      },
      include: {
        verifiedBy: { select: { id: true, username: true } }
      }
    });

    // Update Redis verification status
    const verificationKey = `verification:${id}`;
    await set(verificationKey, {
      status: verificationStatus,
      invoiceId: id,
      verifiedBy: req.user.username,
      verifiedAt: new Date().toISOString(),
      notes: notes || null
    }, 86400); // 24 hours TTL

    logger.info('Invoice verification updated', {
      invoiceId: id,
      verificationStatus,
      enterpriseId: req.user.enterpriseId,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Invoice verification updated successfully',
      data: updatedInvoice
    });

  } catch (error) {
    logger.error('Failed to update invoice verification:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update invoice verification'
      }
    });
  }
});

/**
 * @route   GET /api/invoices/:id/download
 * @desc    Get download URL for invoice file
 * @access  Private
 */
router.get('/:id/download', [
  authenticateToken,
  requireEnterpriseAccess
], async (req, res) => {
  try {
    const { id } = req.params;

    // Get invoice with scanUrl
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        enterpriseId: req.user.enterpriseId
      },
      select: { scanUrl: true }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Invoice not found'
        }
      });
    }

    if (!invoice.scanUrl) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Invoice file not found'
        }
      });
    }

    // Generate presigned download URL
    const urlParts = invoice.scanUrl.split('/');
    const objectName = urlParts[urlParts.length - 1];
    const bucketName = process.env.MINIO_BUCKET_NAME || 'thea-invoices';
    
    const downloadUrl = await getPresignedUrl(bucketName, objectName, 3600); // 1 hour

    res.json({
      success: true,
      data: {
        downloadUrl,
        expiresIn: 3600
      }
    });

  } catch (error) {
    logger.error('Failed to generate download URL:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate download URL'
      }
    });
  }
});

module.exports = router;
