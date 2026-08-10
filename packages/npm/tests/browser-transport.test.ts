import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { BrowserTransport } from '../src/transports/browser.js';
import type { FormattedLogEntry, LogLevel } from '../src/types/config.js';

class FakeStorage {
  private data = new Map<string, string>();
  public failOnSet = false;

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failOnSet) throw new Error('QuotaExceededError');
    this.data.set(key, value);
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }
}

function entry(message: string, level: LogLevel = 'info', context?: Record<string, any>): FormattedLogEntry {
  return {
    level,
    message,
    formattedMessage: `[${level.toUpperCase()}] ${message}`,
    timestamp: new Date('2024-01-01T00:00:00.000Z'),
    context,
    requestId: 'req-1',
    args: [message],
  };
}

describe('BrowserTransport', () => {
  let storage: FakeStorage;
  let logs: string[];
  let groups: string[];
  const original = {
    log: console.log,
    group: console.group,
    groupEnd: console.groupEnd,
    localStorage: (globalThis as any).localStorage,
  };

  beforeEach(() => {
    storage = new FakeStorage();
    (globalThis as any).localStorage = storage;
    logs = [];
    groups = [];
    console.log = (...args: any[]) => logs.push(args.join(' '));
    console.group = (...args: any[]) => groups.push(args.join(' '));
    console.groupEnd = () => {};
  });

  afterEach(() => {
    console.log = original.log;
    console.group = original.group;
    console.groupEnd = original.groupEnd;
    if (original.localStorage === undefined) {
      delete (globalThis as any).localStorage;
    } else {
      (globalThis as any).localStorage = original.localStorage;
    }
  });

  test('prints the pre-formatted message by default', () => {
    const transport = new BrowserTransport({ name: 'browser' });

    transport.log(entry('hello'));

    expect(logs).toEqual(['[INFO] hello']);
    expect(groups).toHaveLength(0);
  });

  test('groups output when a context is present and grouping is enabled', () => {
    const transport = new BrowserTransport({ name: 'browser', enableConsoleGroup: true });

    transport.log(entry('grouped', 'warn', { userId: 7 }));

    expect(groups).toEqual(['WARN: grouped']);
    expect(logs.join(' ')).toContain('Request ID:');
  });

  test('does not group when the context is empty', () => {
    const transport = new BrowserTransport({ name: 'browser', enableConsoleGroup: true });

    transport.log(entry('plain', 'info', {}));

    expect(groups).toHaveLength(0);
    expect(logs).toEqual(['[INFO] plain']);
  });

  test('persists entries to localStorage and reads them back', () => {
    const transport = new BrowserTransport({ name: 'browser', useLocalStorage: true });

    transport.log(entry('stored', 'error', { a: 1 }));

    expect(transport.getLogs()).toEqual([
      {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: 'error',
        message: 'stored',
        context: { a: 1 },
        requestId: 'req-1',
      },
    ]);
    expect(storage.getItem('plip-logs')).not.toBeNull();
  });

  test('honours a custom storage key', () => {
    const transport = new BrowserTransport({
      name: 'browser',
      useLocalStorage: true,
      storageKey: 'my-logs',
    });

    transport.log(entry('keyed'));

    expect(storage.getItem('my-logs')).not.toBeNull();
    expect(storage.getItem('plip-logs')).toBeNull();
  });

  test('drops the oldest entries once maxStorageSize is exceeded', () => {
    const transport = new BrowserTransport({
      name: 'browser',
      useLocalStorage: true,
      maxStorageSize: 400,
    });

    for (let i = 0; i < 50; i++) {
      transport.log(entry(`entry-${i}`));
    }

    const stored = transport.getLogs();
    const serialized = storage.getItem('plip-logs')!;

    expect(serialized.length).toBeLessThanOrEqual(400);
    expect(stored.length).toBeGreaterThan(0);
    expect(stored.length).toBeLessThan(50);
    // Newest entries survive, oldest are evicted.
    expect(stored[stored.length - 1]!.message).toBe('entry-49');
    expect(stored[0]!.message).not.toBe('entry-0');
  });

  test('keeps the newest entry even when it alone exceeds the budget', () => {
    const transport = new BrowserTransport({
      name: 'browser',
      useLocalStorage: true,
      maxStorageSize: 10,
    });

    transport.log(entry('a'.repeat(200)));

    expect(transport.getLogs()).toHaveLength(1);
  });

  test('reports a storage failure instead of throwing', () => {
    const errors: unknown[] = [];
    const transport = new BrowserTransport({
      name: 'browser',
      useLocalStorage: true,
      onError: error => errors.push(error),
    });

    storage.failOnSet = true;

    expect(() => transport.log(entry('boom'))).not.toThrow();
    expect(errors).toHaveLength(1);
  });

  test('clearLogs removes the stored entries', () => {
    const transport = new BrowserTransport({ name: 'browser', useLocalStorage: true });

    transport.log(entry('one'));
    transport.clearLogs();

    expect(transport.getLogs()).toEqual([]);
    expect(storage.getItem('plip-logs')).toBeNull();
  });

  test('does not touch storage when useLocalStorage is off', () => {
    const transport = new BrowserTransport({ name: 'browser' });

    transport.log(entry('unstored'));

    expect(storage.getItem('plip-logs')).toBeNull();
    expect(transport.getLogs()).toEqual([]);
  });
});
