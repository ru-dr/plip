// tests/formatter.test.ts

import { describe, test, expect } from 'bun:test';
import { JsonFormatter, TextFormatter } from '../src/formatters/index.js';
import type { FormattedLogEntry, LogLevel } from '../src/types/config.js';

describe('Formatters', () => {
  const mockEntry: FormattedLogEntry = {
    level: 'info' as LogLevel,
    message: 'test message',
    formattedMessage: '[INFO] test message',
    timestamp: new Date('2024-01-01T10:00:00.000Z'),
    context: { userId: 123, sessionId: 'abc123' },
    requestId: 'req_456',
    args: ['test message'],
  };

  describe('JsonFormatter', () => {
    test('should format entry as JSON', () => {
      const formatter = new JsonFormatter();
      const result = formatter.format(mockEntry);
      
      const parsed = JSON.parse(result);
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('test message');
      expect(parsed.timestamp).toBe('2024-01-01T10:00:00.000Z');
      expect(parsed.context).toEqual({ userId: 123, sessionId: 'abc123' });
      expect(parsed.requestId).toBe('req_456');
    });

    test('should format with pretty printing when enabled', () => {
      const formatter = new JsonFormatter({ pretty: true });
      const result = formatter.format(mockEntry);
      
      expect(result).toContain('\n');
      expect(result).toContain('  '); // Indentation
    });

    test('should exclude fields when configured', () => {
      const formatter = new JsonFormatter({
        includeTimestamp: false,
        includeContext: false,
        includeRequestId: false,
      });
      
      const result = formatter.format(mockEntry);
      const parsed = JSON.parse(result);
      
      expect(parsed.timestamp).toBeUndefined();
      expect(parsed.context).toBeUndefined();
      expect(parsed.requestId).toBeUndefined();
      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('test message');
    });
  });

  describe('TextFormatter', () => {
    test('should format entry as text', () => {
      const formatter = new TextFormatter();
      const result = formatter.format(mockEntry);
      
      expect(result).toContain('2024-01-01T10:00:00.000Z');
      expect(result).toContain('[INFO   ]');
      expect(result).toContain('[req_456]');
      expect(result).toContain('[INFO] test message');
    });

    test('should format timestamp in different formats', () => {
      const formatter = new TextFormatter({ timestampFormat: 'time' });
      const result = formatter.format(mockEntry);
      
      // Should contain time format (not full ISO)
      expect(result).not.toContain('2024-01-01T10:00:00.000Z');
      expect(result).toContain('[INFO   ]');
    });

    test('should exclude fields when configured', () => {
      const formatter = new TextFormatter({
        includeTimestamp: false,
        includeLevel: false,
        includeRequestId: false,
      });
      
      const result = formatter.format(mockEntry);
      
      expect(result).not.toContain('2024-01-01T10:00:00.000Z');
      expect(result).not.toContain('[INFO   ]');
      expect(result).not.toContain('[req_456]');
      expect(result).toBe('[INFO] test message');
    });

    test('should handle custom level padding', () => {
      const formatter = new TextFormatter({ levelPadding: 10 });
      const result = formatter.format(mockEntry);
      
      expect(result).toContain('[INFO      ]'); // 10 character padding (INFO + 6 spaces)
    });
  });
});