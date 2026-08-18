// tests/performance.test.ts

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { loggerFactory } from '../src/core/factory.js';
import { Timer, MemoryUsage, MetricsCollector } from '../src/utils/performance.js';

describe('Performance Tests', () => {
  let originalConsoleLog: typeof console.log;

  beforeEach(() => {
    originalConsoleLog = console.log;
    console.log = () => {}; // Suppress output during performance tests
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe('Timer Utility', () => {
    test('should measure elapsed time accurately', async () => {
      const timer = new Timer('test-timer');
      timer.start();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const elapsed = timer.end();
      expect(elapsed).toBeGreaterThan(40); // Allow some variance
      expect(elapsed).toBeLessThan(100);
    });

    test('should handle multiple timers', () => {
      const timer1 = new Timer('timer1');
      const timer2 = new Timer('timer2');
      
      timer1.start();
      timer2.start();
      
      // Simulate different durations
      const elapsed1 = timer1.end();
      const elapsed2 = timer2.end();
      
      expect(elapsed1).toBeGreaterThanOrEqual(0);
      expect(elapsed2).toBeGreaterThanOrEqual(0);
      expect(timer1.label).toBe('timer1');
      expect(timer2.label).toBe('timer2');
    });
  });

  describe('Memory Usage', () => {
    test('should get memory usage information', () => {
      const usage = MemoryUsage.getUsage();
      
      if (usage) {
        expect(typeof usage.used).toBe('number');
        expect(typeof usage.total).toBe('number');
        expect(typeof usage.percentage).toBe('number');
        expect(usage.used).toBeGreaterThanOrEqual(0);
        expect(usage.total).toBeGreaterThan(0);
        expect(usage.percentage).toBeGreaterThanOrEqual(0);
        expect(usage.percentage).toBeLessThanOrEqual(100);
      }
    });

    test('should format bytes correctly', () => {
      expect(MemoryUsage.formatBytes(0)).toBe('0 Bytes');
      expect(MemoryUsage.formatBytes(1024)).toBe('1 KB');
      expect(MemoryUsage.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(MemoryUsage.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('Metrics Collector', () => {
    test('should collect and manage metrics', () => {
      const collector = new MetricsCollector();
      
      collector.addTimer('operation1', 123.45);
      collector.incrementCounter('requests');
      collector.incrementCounter('requests', 5);
      collector.setGauge('memory_usage', 85.2);
      
      const metrics = collector.getMetrics();
      
      expect(metrics.timers.operation1).toBe(123.45);
      expect(metrics.counters.requests).toBe(6);
      expect(metrics.gauges.memory_usage).toBe(85.2);
    });

    test('should reset metrics', () => {
      const collector = new MetricsCollector();
      
      collector.addTimer('test', 100);
      collector.incrementCounter('test');
      collector.setGauge('test', 50);
      
      collector.reset();
      
      const metrics = collector.getMetrics();
      expect(Object.keys(metrics.timers)).toHaveLength(0);
      expect(Object.keys(metrics.counters)).toHaveLength(0);
      expect(Object.keys(metrics.gauges)).toHaveLength(0);
    });
  });

  describe('Logger Performance', () => {
    test('should handle high-volume logging efficiently', async () => {
      const logger = loggerFactory.create({ silent: true }); // Silent to avoid console overhead
      const messageCount = 1000;
      
      const startTime = performance.now();
      
      for (let i = 0; i < messageCount; i++) {
        logger.info(`Message ${i}`, { iteration: i, timestamp: Date.now() });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const messagesPerMs = messageCount / duration;
      
      // Should be able to handle at least 1 message per millisecond
      expect(messagesPerMs).toBeGreaterThan(1);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle complex object serialization efficiently', async () => {
      const logger = loggerFactory.create({ silent: true });
      
      const complexObject = {
        user: {
          id: 123,
          profile: {
            name: 'Test User',
            preferences: {
              theme: 'dark',
              notifications: {
                email: true,
                push: false,
                sms: true
              }
            }
          }
        },
        metadata: {
          timestamp: Date.now(),
          version: '1.0.0',
          features: ['feature1', 'feature2', 'feature3'],
          config: {
            retries: 3,
            timeout: 5000,
            endpoints: {
              api: 'https://api.example.com',
              cdn: 'https://cdn.example.com'
            }
          }
        }
      };
      
      const iterations = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        logger.info('Complex object log', complexObject);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle complex objects without significant performance degradation
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle multiple transports without significant overhead', async () => {
      const logger = loggerFactory.create({ silent: true });
      
      // Add multiple silent transports
      for (let i = 0; i < 5; i++) {
        logger.addTransport({
          name: `transport-${i}`,
          log: () => {}, // Silent transport
          shouldLog: () => true,
        });
      }
      
      const messageCount = 500;
      const startTime = performance.now();
      
      for (let i = 0; i < messageCount; i++) {
        logger.info(`Multi-transport message ${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should handle multiple transports efficiently
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Logger Timer Integration', () => {
    test('should integrate timer functionality seamlessly', () => {
      const logger = loggerFactory.create();
      
      const timer = logger.startTimer('integration-test');
      expect(timer.label).toBe('integration-test');
      expect(typeof timer.end).toBe('function');
      
      // Timer should be able to end and log
      const logs: string[] = [];
      console.log = (...args: any[]) => {
        logs.push(args.join(' '));
      };
      
      timer.end('Timer completed');
      
      expect(logs).toHaveLength(1);
      expect(logs[0]).toContain('Timer completed');
      expect(logs[0]).toMatch(/\d+\.\d+ms/);
    });
  });
});