import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createPlip, LOG_LEVEL_SEVERITY, levelsAtOrAbove, meetsMinLevel } from '../src/core/index.js';
import type { Transport } from '../src/types/transport.js';

describe('Level severity', () => {
  let consoleLogs: string[] = [];
  const originalLog = console.log;

  beforeEach(() => {
    consoleLogs = [];
    console.log = (...args: any[]) => consoleLogs.push(args.join(' '));
  });

  afterEach(() => {
    console.log = originalLog;
  });

  test('ranks levels from trace up to error', () => {
    expect(LOG_LEVEL_SEVERITY.trace).toBeLessThan(LOG_LEVEL_SEVERITY.debug);
    expect(LOG_LEVEL_SEVERITY.debug).toBeLessThan(LOG_LEVEL_SEVERITY.info);
    expect(LOG_LEVEL_SEVERITY.info).toBeLessThan(LOG_LEVEL_SEVERITY.warn);
    expect(LOG_LEVEL_SEVERITY.warn).toBeLessThan(LOG_LEVEL_SEVERITY.error);
    expect(LOG_LEVEL_SEVERITY.success).toBe(LOG_LEVEL_SEVERITY.info);
  });

  test('levelsAtOrAbove returns the levels a threshold admits', () => {
    expect(levelsAtOrAbove('warn')).toEqual(['warn', 'error']);
    expect(levelsAtOrAbove('info').sort()).toEqual(['error', 'info', 'success', 'warn']);
    expect(levelsAtOrAbove('trace')).toHaveLength(7);
  });

  test('meetsMinLevel compares severity, not list membership', () => {
    expect(meetsMinLevel('error', 'warn')).toBe(true);
    expect(meetsMinLevel('debug', 'warn')).toBe(false);
    expect(meetsMinLevel('warn', 'warn')).toBe(true);
  });

  test('minLevel config drops everything below the threshold', () => {
    const logger = createPlip({ devOnly: false, enableColors: false, minLevel: 'warn' });

    logger.info('dropped');
    logger.debug('dropped');
    logger.warn('kept');
    logger.error('kept');

    expect(consoleLogs).toEqual(['[WARN] kept', '[ERROR] kept']);
  });

  test('minLevel() is chainable and returns a new logger', () => {
    const base = createPlip({ devOnly: false, enableColors: false });
    const quiet = base.minLevel('error');

    quiet.warn('dropped');
    quiet.error('kept');
    base.warn('still logged');

    expect(consoleLogs).toEqual(['[ERROR] kept', '[WARN] still logged']);
  });

  test('minLevel and enabledLevels intersect', () => {
    const logger = createPlip({
      devOnly: false,
      enableColors: false,
      minLevel: 'warn',
      enabledLevels: ['info', 'warn'],
    });

    logger.info('below threshold');
    logger.error('not in allowlist');
    logger.warn('kept');

    expect(consoleLogs).toEqual(['[WARN] kept']);
  });
});

describe('Transport error handling', () => {
  const failing = (name: string, error: Error, async: boolean): Transport => ({
    name,
    log: () => {
      if (async) return Promise.reject(error);
      throw error;
    },
  });

  test('a synchronous transport failure reaches onError', async () => {
    const seen: Array<[unknown, string]> = [];
    const logger = createPlip({ devOnly: false, onError: (e, n) => seen.push([e, n]) });

    logger.clearTransports();
    logger.addTransport(failing('boom', new Error('sync failure'), false));
    await logger.flush();
    logger.info('trigger');
    await logger.flush();

    expect(seen).toHaveLength(1);
    expect(String(seen[0]![0])).toContain('sync failure');
    expect(seen[0]![1]).toBe('boom');
  });

  test('a rejected transport promise reaches onError', async () => {
    const seen: string[] = [];
    const logger = createPlip({ devOnly: false, onError: (_e, name) => seen.push(name) });

    logger.clearTransports();
    logger.addTransport(failing('remote', new Error('async failure'), true));
    logger.info('trigger');
    await logger.flush();

    expect(seen).toEqual(['remote']);
  });

  test('one failing transport does not stop the others', async () => {
    const delivered: string[] = [];
    const logger = createPlip({ devOnly: false, onError: () => {} });

    logger.clearTransports();
    logger.addTransport(failing('bad', new Error('nope'), true));
    logger.addTransport({ name: 'good', log: entry => { delivered.push(entry.message); } });

    logger.info('still delivered');
    await logger.flush();

    expect(delivered).toEqual(['still delivered']);
  });

  test('flush waits for slow transports to finish', async () => {
    const delivered: string[] = [];
    const logger = createPlip({ devOnly: false });

    logger.clearTransports();
    logger.addTransport({
      name: 'slow',
      log: async entry => {
        await new Promise(resolve => setTimeout(resolve, 20));
        delivered.push(entry.message);
      },
    });

    logger.info('slow write');
    expect(delivered).toEqual([]);

    await logger.flush();
    expect(delivered).toEqual(['slow write']);
  });

  test('flush calls a transport flush hook', async () => {
    let flushed = 0;
    const logger = createPlip({ devOnly: false });

    logger.clearTransports();
    logger.addTransport({ name: 'buffered', log: () => {}, flush: () => { flushed++; } });

    await logger.flush();

    expect(flushed).toBe(1);
  });
});

describe('Request ids', () => {
  let consoleLogs: string[] = [];
  const originalLog = console.log;

  beforeEach(() => {
    consoleLogs = [];
    console.log = (...args: any[]) => consoleLogs.push(args.join(' '));
  });

  afterEach(() => {
    console.log = originalLog;
  });

  test('a context requestId is used verbatim', async () => {
    const logger = createPlip({ devOnly: false, includeRequestId: true, enableStructuredOutput: true });

    logger.child({ requestId: 'req-from-caller' }).info('hello');

    expect(JSON.parse(consoleLogs[0]!).requestId).toBe('req-from-caller');
  });

  test('a generated id is stable per logger and unique across loggers', () => {
    const config = { devOnly: false, includeRequestId: true, enableStructuredOutput: true };
    const a = createPlip(config);
    const b = createPlip(config);

    a.info('one');
    a.info('two');
    b.info('three');

    const [first, second, third] = consoleLogs.map(line => JSON.parse(line).requestId);
    expect(first).toBe(second!);
    expect(third).not.toBe(first!);
    expect(first).toMatch(/^[0-9a-z-]{10,}$/i);
  });
});
