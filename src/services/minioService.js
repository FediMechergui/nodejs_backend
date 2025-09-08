const Minio = require('minio');
const { logger } = require('../config/logger');
const path = require('path');
const fs = require('fs').promises;

let minioClient = null;

/**
 * Initialize MinIO connection
 */
async function initializeMinIO() {
  try {
    minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });

    // Test connection
    await minioClient.listBuckets();
    logger.info('✅ MinIO connection established successfully');
    
    // Ensure required buckets exist
    await ensureBuckets();
    logger.info('✅ MinIO buckets initialized');
    
  } catch (error) {
    logger.error('❌ MinIO initialization failed:', error);
    throw error;
  }
}

/**
 * Ensure required buckets exist
 */
async function ensureBuckets() {
  const requiredBuckets = [
    process.env.MINIO_BUCKET_NAME || 'thea-invoices',
    'thea-documents',
    'thea-templates',
    'thea-backups'
  ];

  for (const bucketName of requiredBuckets) {
    try {
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName, 'us-east-1');
        logger.info(`✅ Created MinIO bucket: ${bucketName}`);
        
        // Set bucket policy for invoices bucket
        if (bucketName === (process.env.MINIO_BUCKET_NAME || 'thea-invoices')) {
          await setBucketPolicy(bucketName);
        }
      }
    } catch (error) {
      logger.error(`❌ Failed to create bucket ${bucketName}:`, error);
      throw error;
    }
  }
}

/**
 * Set bucket policy for invoices bucket
 */
async function setBucketPolicy(bucketName) {
  try {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            AWS: ['*']
          },
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject'
          ],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }
      ]
    };

    await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    logger.info(`✅ Set bucket policy for ${bucketName}`);
  } catch (error) {
    logger.error(`❌ Failed to set bucket policy for ${bucketName}:`, error);
  }
}

/**
 * Get MinIO client instance
 */
function getMinioClient() {
  if (!minioClient) {
    throw new Error('MinIO client not initialized. Call initializeMinIO() first.');
  }
  return minioClient;
}

/**
 * Upload file to MinIO
 */
async function uploadFile(bucketName, objectName, filePath, metadata = {}) {
  try {
    const client = getMinioClient();
    
    // Check if file exists
    await fs.access(filePath);
    
    // Upload file
    await client.fPutObject(bucketName, objectName, filePath, metadata);
    
    logger.info(`✅ File uploaded: ${bucketName}/${objectName}`);
    return {
      bucket: bucketName,
      object: objectName,
      size: (await fs.stat(filePath)).size
    };
  } catch (error) {
    logger.error('❌ File upload failed:', error);
    throw error;
  }
}

/**
 * Download file from MinIO
 */
async function downloadFile(bucketName, objectName, destinationPath) {
  try {
    const client = getMinioClient();
    
    // Ensure destination directory exists
    const dir = path.dirname(destinationPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Download file
    await client.fGetObject(bucketName, objectName, destinationPath);
    
    logger.info(`✅ File downloaded: ${bucketName}/${objectName} -> ${destinationPath}`);
    return destinationPath;
  } catch (error) {
    logger.error('❌ File download failed:', error);
    throw error;
  }
}

/**
 * Generate presigned URL for file upload
 */
async function getPresignedUrl(bucketName, objectName, expirySeconds = 900) { // 15 minutes default
  try {
    const client = getMinioClient();
    const url = await client.presignedPutObject(bucketName, objectName, expirySeconds);
    
    logger.debug(`Generated presigned URL for ${bucketName}/${objectName}`);
    return url;
  } catch (error) {
    logger.error('❌ Failed to generate presigned URL:', error);
    throw error;
  }
}

/**
 * Generate presigned URL for file download
 */
async function getPresignedDownloadUrl(bucketName, objectName, expirySeconds = 3600) { // 1 hour default
  try {
    const client = getMinioClient();
    const url = await client.presignedGetObject(bucketName, objectName, expirySeconds);
    
    logger.debug(`Generated presigned download URL for ${bucketName}/${objectName}`);
    return url;
  } catch (error) {
    logger.error('❌ Failed to generate presigned download URL:', error);
    throw error;
  }
}

/**
 * Delete file from MinIO
 */
async function deleteFile(bucketName, objectName) {
  try {
    const client = getMinioClient();
    await client.removeObject(bucketName, objectName);
    
    logger.info(`✅ File deleted: ${bucketName}/${objectName}`);
    return true;
  } catch (error) {
    logger.error('❌ File deletion failed:', error);
    throw error;
  }
}

/**
 * List objects in bucket
 */
async function listObjects(bucketName, prefix = '', recursive = true) {
  try {
    const client = getMinioClient();
    const objects = [];
    
    const stream = client.listObjects(bucketName, prefix, recursive);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        objects.push({
          name: obj.name,
          size: obj.size,
          lastModified: obj.lastModified,
          etag: obj.etag
        });
      });
      
      stream.on('error', reject);
      stream.on('end', () => resolve(objects));
    });
  } catch (error) {
    logger.error('❌ Failed to list objects:', error);
    throw error;
  }
}

/**
 * Get file metadata
 */
async function getFileMetadata(bucketName, objectName) {
  try {
    const client = getMinioClient();
    const stat = await client.statObject(bucketName, objectName);
    
    return {
      size: stat.size,
      lastModified: stat.lastModified,
      etag: stat.etag,
      contentType: stat.metaData?.['content-type'] || 'application/octet-stream',
      metadata: stat.metaData || {}
    };
  } catch (error) {
    logger.error('❌ Failed to get file metadata:', error);
    throw error;
  }
}

/**
 * Copy file within MinIO
 */
async function copyFile(sourceBucket, sourceObject, destBucket, destObject) {
  try {
    const client = getMinioClient();
    await client.copyObject(destBucket, destObject, `${sourceBucket}/${sourceObject}`);
    
    logger.info(`✅ File copied: ${sourceBucket}/${sourceObject} -> ${destBucket}/${destObject}`);
    return true;
  } catch (error) {
    logger.error('❌ File copy failed:', error);
    throw error;
  }
}

/**
 * Close MinIO connection
 */
async function closeMinIO() {
  try {
    if (minioClient) {
      // MinIO client doesn't have a close method, just clear the reference
      minioClient = null;
      logger.info('🔌 MinIO connection closed');
    }
  } catch (error) {
    logger.error('❌ MinIO close error:', error);
  }
}

module.exports = {
  initializeMinIO,
  getMinioClient,
  uploadFile,
  downloadFile,
  getPresignedUrl,
  getPresignedDownloadUrl,
  deleteFile,
  listObjects,
  getFileMetadata,
  copyFile,
  closeMinIO
};
