// tests/transport.test.ts

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { ConsoleTransport, BrowserTransport } from '../src/transports/index.js';
import { TransportManager, BaseTransport } from '../src/core/transport.js';
import type { FormattedLogEntry, LogLevel } from '../src/types/config.js';

// Mock transport for testing
class MockTransport extends BaseTransport {
  public logs: FormattedLogEntry[] = [];
  
  log(entry: FormattedLogEntry): void {
    this.logs.push(entry);
  }
}

describe('Transport System', () => {
  let mockEntry: FormattedLogEntry;
  
  beforeEach(() => {
    mockEntry = {
      level: 'info' as LogLevel,
      message: 'test message',
      formattedMessage: '[INFO] test message',
      timestamp: new Date(),
      context: { key: 'value' },
      requestId: 'req_123',
      args: ['test message'],
    };
  });

  describe('BaseTransport', () => {
    test('should have correct name', () => {
      const transport = new MockTransport({ name: 'mock' });
      expect(transport.name).toBe('mock');
    });

    test('should log entries', () => {
      const transport = new MockTransport({ name: 'mock' });
      transport.log(mockEntry);
      expect(transport.logs).toHaveLength(1);
      expect(transport.logs[0]).toEqual(mockEntry);
    });

    test('should respect level filtering', () => {
      const transport = new MockTransport({ 
        name: 'mock', 
        level: ['error', 'warn'] 
      });
      
      expect(transport.shouldLog('error')).toBe(true);
      expect(transport.shouldLog('warn')).toBe(true);
      expect(transport.shouldLog('info')).toBe(false);
    });

    test('should respect silent mode', () => {
      const transport = new MockTransport({ 
        name: 'mock', 
        silent: true 
      });
      
      expect(transport.shouldLog('error')).toBe(false);
      expect(transport.shouldLog('info')).toBe(false);
    });
  });

  describe('TransportManager', () => {
    let manager: TransportManager;
    
    beforeEach(() => {
      manager = new TransportManager();
    });

    test('should add and retrieve transports', () => {
      const transport = new MockTransport({ name: 'mock' });
      manager.addTransport(transport);
      
      expect(manager.getTransports()).toHaveLength(1);
      expect(manager.getTransport('mock')).toBe(transport);
    });

    test('should remove transports', () => {
      const transport = new MockTransport({ name: 'mock' });
      manager.addTransport(transport);
      
      const removed = manager.removeTransport('mock');
      expect(removed).toBe(true);
      expect(manager.getTransports()).toHaveLength(0);
    });

    test('should clear all transports', () => {
      manager.addTransport(new MockTransport({ name: 'mock1' }));
      manager.addTransport(new MockTransport({ name: 'mock2' }));
      
      manager.clearTransports();
      expect(manager.getTransports()).toHaveLength(0);
    });

    test('should log to all transports', async () => {
      const transport1 = new MockTransport({ name: 'mock1' });
      const transport2 = new MockTransport({ name: 'mock2' });
      
      manager.addTransport(transport1);
      manager.addTransport(transport2);
      
      await manager.log(mockEntry);
      
      expect(transport1.logs).toHaveLength(1);
      expect(transport2.logs).toHaveLength(1);
    });
  });

  describe('ConsoleTransport', () => {
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

    test('should log to console', () => {
      const transport = new ConsoleTransport({ name: 'console' });
      transport.log(mockEntry);
      
      expect(logs).toHaveLength(1);
      expect(logs[0]).toContain('test message');
    });
  });

  describe('BrowserTransport', () => {
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

    test('should log to console', () => {
      const transport = new BrowserTransport({ 
        name: 'browser',
        useLocalStorage: false 
      });
      transport.log(mockEntry);
      
      expect(logs).toHaveLength(1);
      expect(logs[0]).toContain('test message');
    });

    test('should support console grouping', () => {
      const transport = new BrowserTransport({ 
        name: 'browser',
        enableConsoleGroup: true,
        useLocalStorage: false
      });

      // Mock console.group methods
      let groupCalled = false;
      let groupEndCalled = false;
      const originalGroup = console.group;
      const originalGroupEnd = console.groupEnd;
      
      console.group = () => { groupCalled = true; };
      console.groupEnd = () => { groupEndCalled = true; };
      
      transport.log(mockEntry);
      
      expect(groupCalled).toBe(true);
      expect(groupEndCalled).toBe(true);
      
      // Restore
      console.group = originalGroup;
      console.groupEnd = originalGroupEnd;
    });
  });
});