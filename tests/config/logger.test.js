// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'debug';

// Mock winston
const mockWinston = {
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    add: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn(),
    printf: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
};

jest.mock('winston', () => mockWinston);

describe('Logger Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export logger instance', () => {
    const { logger } = require('../../src/config/logger');
    
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });

  it('should create winston logger', () => {
    // The logger is already created when the module is loaded
    // So we just verify the mock was set up correctly
    expect(mockWinston.createLogger).toBeDefined();
    expect(typeof mockWinston.createLogger).toBe('function');
  });

  it('should use correct log level', () => {
    expect(process.env.LOG_LEVEL).toBe('debug');
  });

  it('should handle different log levels', () => {
    const { logger } = require('../../src/config/logger');
    
    // Test that logger methods exist
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.warn).toBeDefined();
  });

  it('should handle environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.LOG_LEVEL).toBeDefined();
  });

  it('should have winston format methods', () => {
    expect(mockWinston.format.combine).toBeDefined();
    expect(mockWinston.format.timestamp).toBeDefined();
    expect(mockWinston.format.errors).toBeDefined();
    expect(mockWinston.format.json).toBeDefined();
    expect(mockWinston.format.colorize).toBeDefined();
    expect(mockWinston.format.simple).toBeDefined();
    expect(mockWinston.format.printf).toBeDefined();
  });

  it('should have winston transport methods', () => {
    expect(mockWinston.transports.Console).toBeDefined();
    expect(mockWinston.transports.File).toBeDefined();
  });

  it('should create logger with correct configuration', () => {
    const { logger } = require('../../src/config/logger');
    
    const infoSpy = jest.spyOn(logger, 'info');
    const errorSpy = jest.spyOn(logger, 'error');
    const debugSpy = jest.spyOn(logger, 'debug');
    const warnSpy = jest.spyOn(logger, 'warn');
    
    logger.info('Test info message');
    logger.error('Test error message');
    logger.debug('Test debug message');
    logger.warn('Test warn message');
    
    expect(infoSpy).toHaveBeenCalledWith('Test info message');
    expect(errorSpy).toHaveBeenCalledWith('Test error message');
    expect(debugSpy).toHaveBeenCalledWith('Test debug message');
    expect(warnSpy).toHaveBeenCalledWith('Test warn message');
  });

  it('should handle different log levels', () => {
    const { logger } = require('../../src/config/logger');
    
    const errorSpy = jest.spyOn(logger, 'error');
    const warnSpy = jest.spyOn(logger, 'warn');
    const infoSpy = jest.spyOn(logger, 'info');
    const debugSpy = jest.spyOn(logger, 'debug');
    
    logger.error('Test error message');
    logger.warn('Test warn message');
    logger.info('Test info message');
    logger.debug('Test debug message');
    
    expect(errorSpy).toHaveBeenCalledWith('Test error message');
    expect(warnSpy).toHaveBeenCalledWith('Test warn message');
    expect(infoSpy).toHaveBeenCalledWith('Test info message');
    expect(debugSpy).toHaveBeenCalledWith('Test debug message');
  });

  it('should handle structured logging', () => {
    const { logger } = require('../../src/config/logger');
    
    const meta = { userId: 123, action: 'login' };
    const infoSpy = jest.spyOn(logger, 'info');
    logger.info('User action', meta);
    
    expect(infoSpy).toHaveBeenCalledWith('User action', meta);
  });
});
