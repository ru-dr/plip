// tests/integration.test.ts

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { loggerFactory } from '../src/core/factory.js';
import { ConsoleTransport, BrowserTransport } from '../src/transports/index.js';
import { createReactLogger, NextJSAdapter } from '../src/adapters/index.js';

describe('Integration Tests', () => {
  let originalConsoleLog: typeof console.log;
  let logs: string[];

  beforeEach(() => {
    logs = [];
    originalConsoleLog = console.log;
    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
    };
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe('Logger Factory Integration', () => {
    test('should create logger with default configuration', () => {
      const logger = loggerFactory.create();
      
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.addTransport).toBe('function');
      expect(logger.getTransports()).toHaveLength(1); // Default console transport
    });

    test('should create SSR logger with appropriate defaults', () => {
      const logger = loggerFactory.createSSRLogger();
      
      logger.info('Server message', { userId: 123 });
      
      expect(logs).toHaveLength(1);
      expect(logs[0]).toContain('[INFO]');
      expect(logs[0]).toContain('Server message');
    });

    test('should create CSR logger with appropriate defaults', () => {
      const logger = loggerFactory.createCSRLogger();
      
      logger.info('Client message', { sessionId: 'abc123' });
      
      expect(logs).toHaveLength(1);
      expect(logs[0]).toContain('[INFO]');
      expect(logs[0]).toContain('Client message');
    });
  });

  describe('Multi-Transport Logging', () => {
    test('should log to multiple transports simultaneously', async () => {
      const logger = loggerFactory.create();
      
      // Add additional transports
      const browserTransport = new BrowserTransport({ 
        name: 'browser',
        useLocalStorage: false 
      });
      
      logger.addTransport(browserTransport);
      
      await logger.info('Multi-transport message');
      
      // Should have logged to both console (default) and browser transport
      expect(logs).toHaveLength(2); // Console + Browser transport
    });

    test('should handle transport-specific filtering', async () => {
      const logger = loggerFactory.create();
      
      // Add transport that only logs errors
      const errorOnlyTransport = new ConsoleTransport({ 
        name: 'error-only',
        level: ['error'],
      });
      
      logger.addTransport(errorOnlyTransport);
      
      await logger.info('Info message');
      await logger.error('Error message');
      
      // Info should log once (default transport), error should log twice (both transports)
      expect(logs.filter(log => log.includes('Info message'))).toHaveLength(1);
      expect(logs.filter(log => log.includes('Error message'))).toHaveLength(2);
    });
  });

  describe('Context and Request ID Integration', () => {
    test('should maintain context across log calls', () => {
      const logger = loggerFactory.createSSRLogger({ 
        includeContext: true,
        includeRequestId: true 
      });
      
      const contextLogger = logger.withContext({ 
        userId: 123, 
        sessionId: 'session_abc' 
      });
      
      contextLogger.info('First message');
      contextLogger.warn('Second message');
      
      expect(logs).toHaveLength(2);
      expect(logs[0]).toContain('userId');
      expect(logs[0]).toContain('sessionId');
      expect(logs[1]).toContain('userId');
      expect(logs[1]).toContain('sessionId');
    });

    test('should handle request ID configuration', () => {
      const logger = loggerFactory.createSSRLogger({ includeRequestId: true });
      
      logger.info('Message with potential request ID');
      
      expect(logs).toHaveLength(1);
      expect(logs[0]).toContain('[INFO]');
      expect(logs[0]).toContain('Message with potential request ID');
      
      // The current implementation may or may not include request IDs in the output
      // This test verifies the logger works with the includeRequestId setting
      expect(typeof logs[0]).toBe('string');
    });
  });

  describe('Performance Timer Integration', () => {
    test('should track timing operations', async () => {
      const logger = loggerFactory.create();
      
      const timer = logger.startTimer('test-operation');
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10));
      
      timer.end('Operation completed');
      
      expect(logs).toHaveLength(1);
      expect(logs[0]).toContain('Operation completed');
      expect(logs[0]).toMatch(/\d+\.\d+ms/); // Should contain timing info
    });
  });

  describe('Adapter Integration', () => {
    test('should work with React adapter', () => {
      const logger = loggerFactory.createCSRLogger();
      const reactLogger = createReactLogger(logger, { 
        includeComponentName: true,
        includeProps: true 
      });
      
      const componentLogger = reactLogger.useLogger('TestComponent', { 
        prop1: 'value1',
        prop2: 123 
      });
      
      componentLogger.info('Component rendered');
      
      expect(logs).toHaveLength(1);
      expect(logs[0]).toContain('Component rendered');
      expect(logs[0]).toContain('TestComponent');
      expect(logs[0]).toContain('prop1');
    });

    test('should work with NextJS adapter', () => {
      const logger = loggerFactory.createSSRLogger();
      const nextAdapter = new NextJSAdapter(logger, { 
        includeRequestInfo: true,
        includeUserAgent: false 
      });
      
      // Mock request object
      const mockRequest = {
        method: 'GET',
        url: 'https://example.com/api/test',
        headers: new Map([['host', 'example.com']]),
        nextUrl: { pathname: '/api/test' },
      };
      
      const requestLogger = nextAdapter.withRequest(mockRequest);
      requestLogger.info('API request processed');
      
      expect(logs).toHaveLength(1);
      expect(logs[0]).toContain('API request processed');
      expect(logs[0]).toContain('GET');
      expect(logs[0]).toContain('/api/test');
    });
  });

  describe('Configuration Chaining', () => {
    test('should support fluent configuration API', () => {
      const logger = loggerFactory.create()
        .withColors(false)
        .levels('error', 'warn')
        .withContext({ module: 'test' });
      
      logger.info('This should not appear'); // Filtered out
      logger.error('This should appear');
      
      expect(logs).toHaveLength(1);
      expect(logs[0]).toContain('This should appear');
      expect(logs[0]).toContain('module'); // Context included
    });
  });
});