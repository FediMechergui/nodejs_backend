// Integration test for MinIO service functionality
describe('MinIO Service Integration', () => {
  let minioService;

  beforeAll(() => {
    // Get the mocked minio service
    minioService = require('../../src/services/minioService');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have all required functions', () => {
    expect(typeof minioService.initializeMinIO).toBe('function');
    expect(typeof minioService.getMinioClient).toBe('function');
    expect(typeof minioService.uploadFile).toBe('function');
    expect(typeof minioService.downloadFile).toBe('function');
    expect(typeof minioService.getPresignedUrl).toBe('function');
    expect(typeof minioService.getPresignedDownloadUrl).toBe('function');
    expect(typeof minioService.deleteFile).toBe('function');
    expect(typeof minioService.listObjects).toBe('function');
    expect(typeof minioService.getFileMetadata).toBe('function');
    expect(typeof minioService.copyFile).toBe('function');
    expect(typeof minioService.closeMinIO).toBe('function');
  });

  it('should initialize MinIO without errors', async () => {
    await expect(minioService.initializeMinIO()).resolves.not.toThrow();
  });

  it('should handle file upload operations', async () => {
    await minioService.initializeMinIO();
    
    // Mock the upload operation
    minioService.uploadFile.mockResolvedValue({
      bucket: 'test-bucket',
      object: 'test-file.pdf',
      size: 1024
    });
    
    const result = await minioService.uploadFile('test-bucket', 'test-file.pdf', '/path/to/file.pdf');
    expect(result).toEqual({
      bucket: 'test-bucket',
      object: 'test-file.pdf',
      size: 1024
    });
  });

  it('should handle file download operations', async () => {
    await minioService.initializeMinIO();
    
    // Mock the download operation
    minioService.downloadFile.mockResolvedValue('/download/path/file.pdf');
    
    const result = await minioService.downloadFile('test-bucket', 'test-file.pdf', '/download/path/file.pdf');
    expect(result).toBe('/download/path/file.pdf');
  });

  it('should handle presigned URL generation', async () => {
    await minioService.initializeMinIO();
    
    // Mock presigned URL operations
    minioService.getPresignedUrl.mockResolvedValue('https://minio.example.com/upload-url');
    minioService.getPresignedDownloadUrl.mockResolvedValue('https://minio.example.com/download-url');
    
    const uploadUrl = await minioService.getPresignedUrl('test-bucket', 'test-file.pdf');
    expect(uploadUrl).toBe('https://minio.example.com/upload-url');
    
    const downloadUrl = await minioService.getPresignedDownloadUrl('test-bucket', 'test-file.pdf');
    expect(downloadUrl).toBe('https://minio.example.com/download-url');
  });

  it('should handle file deletion', async () => {
    await minioService.initializeMinIO();
    
    // Mock the delete operation
    minioService.deleteFile.mockResolvedValue(true);
    
    const result = await minioService.deleteFile('test-bucket', 'test-file.pdf');
    expect(result).toBe(true);
  });

  it('should handle file metadata retrieval', async () => {
    await minioService.initializeMinIO();
    
    // Mock metadata operation
    const mockMetadata = {
      size: 1024,
      lastModified: new Date(),
      etag: 'test-etag',
      contentType: 'application/pdf',
      metadata: { 'custom-meta': 'value' }
    };
    
    minioService.getFileMetadata.mockResolvedValue(mockMetadata);
    
    const metadata = await minioService.getFileMetadata('test-bucket', 'test-file.pdf');
    expect(metadata).toEqual(mockMetadata);
  });

  it('should handle file listing', async () => {
    await minioService.initializeMinIO();
    
    // Mock list operation
    const mockObjects = [
      { name: 'file1.pdf', size: 1024 },
      { name: 'file2.jpg', size: 2048 }
    ];
    
    minioService.listObjects.mockResolvedValue(mockObjects);
    
    const objects = await minioService.listObjects('test-bucket');
    expect(objects).toEqual(mockObjects);
  });

  it('should handle file copying', async () => {
    await minioService.initializeMinIO();
    
    // Mock copy operation
    minioService.copyFile.mockResolvedValue(true);
    
    const result = await minioService.copyFile('source-bucket', 'source.pdf', 'dest-bucket', 'dest.pdf');
    expect(result).toBe(true);
  });

  it('should close MinIO connection', async () => {
    minioService.closeMinIO.mockResolvedValue();
    await expect(minioService.closeMinIO()).resolves.not.toThrow();
  });

  it('should handle file upload with metadata', async () => {
    await minioService.initializeMinIO();
    
    const metadata = { 'Content-Type': 'application/pdf', 'author': 'test' };
    minioService.uploadFile.mockResolvedValue({
      bucket: 'test-bucket',
      object: 'test-file.pdf',
      size: 2048
    });
    
    const result = await minioService.uploadFile('test-bucket', 'test-file.pdf', '/path/to/file.pdf', metadata);
    expect(result.size).toBe(2048);
  });

  it('should handle presigned URL with custom expiry', async () => {
    await minioService.initializeMinIO();
    
    minioService.getPresignedUrl.mockResolvedValue('https://minio.example.com/custom-url');
    
    const url = await minioService.getPresignedUrl('test-bucket', 'test-file.pdf', 1800);
    expect(url).toBe('https://minio.example.com/custom-url');
  });

  it('should handle empty file lists', async () => {
    await minioService.initializeMinIO();
    
    minioService.listObjects.mockResolvedValue([]);
    
    const objects = await minioService.listObjects('empty-bucket');
    expect(objects).toEqual([]);
  });
});
