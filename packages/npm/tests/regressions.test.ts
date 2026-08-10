// tests/regressions.test.ts

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createPlip } from '../src/core/index.js';
import { FileTransport } from '../src/transports/file.js';
import { TextFormatter } from '../src/formatters/text.js';
import { hasColors, highlightCode, stripColors } from '../src/utils/colors.js';
import { getRuntimeEnvironment } from '../src/utils/env.js';
import type { FormattedLogEntry, LogLevel } from '../src/types/config.js';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Regressions', () => {
  let consoleLogs: string[] = [];
  const originalLog = console.log;

  beforeEach(() => {
    consoleLogs = [];
    console.log = (...args: any[]) => {
      consoleLogs.push(args.join(' '));
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  test('withColors(false) actually removes colors from output', () => {
    const logger = createPlip({ devOnly: false, enableColors: true });

    logger.info('colored');
    expect(hasColors(consoleLogs[0] || '')).toBe(true);

    logger.withColors(false).info('plain');
    expect(hasColors(consoleLogs[1] || '')).toBe(false);
    expect(consoleLogs[1]).toContain('[INFO] plain');
  });

  test('levels() on a derived logger is not blocked by a stale transport filter', () => {
    const logger = createPlip({ devOnly: false, enabledLevels: ['error'] });

    logger.levels('info').info('now enabled');

    expect(consoleLogs).toHaveLength(1);
    expect(consoleLogs[0]).toContain('now enabled');
  });

  test('derived loggers share transports instead of half-closing copies', () => {
    const logger = createPlip({ devOnly: false });
    const child = logger.withContext({ scope: 'child' });

    expect(child.getTransports()).toHaveLength(1);

    child.clearTransports();

    // Parent and child see the same transport set.
    expect(logger.getTransports()).toHaveLength(0);
    logger.info('goes nowhere');
    expect(consoleLogs).toHaveLength(0);
  });

  test('Error arguments log their message and stack, not {}', () => {
    const logger = createPlip({ devOnly: false, enableColors: false });

    logger.error(new Error('boom'));

    expect(consoleLogs[0]).toContain('boom');
    expect(consoleLogs[0]).not.toContain('{}');
  });

  test('TextFormatter keeps ANSI codes out of plain-text output', () => {
    const entry: FormattedLogEntry = {
      level: 'info' as LogLevel,
      message: 'plain message',
      formattedMessage: '\x1b[36m[INFO]\x1b[39m plain message',
      timestamp: new Date('2024-01-01T10:00:00.000Z'),
      args: ['plain message'],
    };

    const result = new TextFormatter().format(entry);

    expect(hasColors(result)).toBe(false);
    expect(result).toContain('plain message');
  });

  test('logger message stays uncolored while console output is colored', () => {
    const logger = createPlip({
      devOnly: false,
      enableColors: true,
      enableSyntaxHighlighting: true,
    });

    const captured: FormattedLogEntry[] = [];
    logger.clearTransports();
    logger.addTransport({
      name: 'capture',
      log: (entry) => {
        captured.push(entry);
      },
    });

    logger.info('object:', { userId: 123 });

    expect(captured).toHaveLength(1);
    expect(hasColors(captured[0]!.message)).toBe(false);
    expect(hasColors(captured[0]!.formattedMessage)).toBe(true);
  });

  test('FileTransport writes every entry even under concurrent logging', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'plip-file-'));
    const filename = join(dir, 'nested', 'app.log');

    try {
      const transport = new FileTransport({ name: 'file', filename, format: 'text' });

      const entries = Array.from({ length: 25 }, (_, i) => ({
        level: 'info' as LogLevel,
        message: `entry-${i}`,
        formattedMessage: `[INFO] entry-${i}`,
        timestamp: new Date(),
        args: [`entry-${i}`],
      }));

      // Fire all logs without awaiting in between, then close.
      await Promise.all(entries.map((entry) => transport.log(entry)));
      await transport.close();

      const contents = readFileSync(filename, 'utf8');
      const lines = contents.trim().split('\n');

      expect(lines).toHaveLength(25);
      for (let i = 0; i < 25; i++) {
        expect(contents).toContain(`entry-${i}`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('getRuntimeEnvironment prefers Deno over the Node process shim', () => {
    const globals = globalThis as any;
    expect(globals.Deno).toBeUndefined();

    globals.Deno = { version: { deno: '1.0.0' } };
    try {
      expect(getRuntimeEnvironment()).toBe('deno');
    } finally {
      delete globals.Deno;
    }
  });
});

describe('Configuration flags', () => {
  let consoleLogs: string[] = [];
  const originalLog = console.log;

  beforeEach(() => {
    consoleLogs = [];
    console.log = (...args: any[]) => {
      consoleLogs.push(args.join(' '));
    };
  });

  afterEach(() => {
    console.log = originalLog;
  });

  test('enableTimestamp prefixes an ISO timestamp', () => {
    createPlip({ devOnly: false, enableColors: false, enableTimestamp: true }).info('hello');

    expect(consoleLogs[0]).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z \[INFO\] hello$/);
  });

  test('enableTimestamp defaults to off', () => {
    createPlip({ devOnly: false, enableColors: false }).info('hello');

    expect(consoleLogs[0]).toBe('[INFO] hello');
  });

  test('enableStructuredOutput emits one JSON object per line', () => {
    createPlip({ devOnly: false, enableStructuredOutput: true, includeRequestId: true })
      .withContext({ service: 'api' })
      .info('structured');

    const parsed = JSON.parse(consoleLogs[0]!);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toContain('structured');
    expect(parsed.context).toEqual({ service: 'api' });
    expect(typeof parsed.timestamp).toBe('string');
    expect(typeof parsed.requestId).toBe('string');
  });
});

describe('JSON highlighting', () => {
  test('does not corrupt values containing quotes or colons', () => {
    const value = {
      url: 'https://example.dev/a:b',
      quoted: 'he said "hi": ok',
      count: -1.5e3,
      ok: true,
      nil: null,
    };
    const json = JSON.stringify(value, null, 2);

    const highlighted = highlightCode(json, 'json');

    expect(hasColors(highlighted)).toBe(true);
    expect(stripColors(highlighted)).toBe(json);
    expect(JSON.parse(stripColors(highlighted))).toEqual(value);
  });
});
