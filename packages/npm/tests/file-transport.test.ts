import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { FileTransport } from '../src/transports/file.js';
import type { FormattedLogEntry, LogLevel } from '../src/types/config.js';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function entry(message: string, level: LogLevel = 'info'): FormattedLogEntry {
  return {
    level,
    message,
    formattedMessage: `[${level.toUpperCase()}] ${message}`,
    timestamp: new Date('2024-01-01T00:00:00.000Z'),
    context: { service: 'api' },
    requestId: 'req-1',
    args: [message],
  };
}

describe('FileTransport', () => {
  let dir: string;
  let filename: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'plip-file-'));
    filename = join(dir, 'app.log');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test('creates missing directories', async () => {
    const nested = join(dir, 'a', 'b', 'app.log');
    const transport = new FileTransport({ name: 'file', filename: nested });

    await transport.log(entry('nested'));

    expect(existsSync(nested)).toBe(true);
  });

  test('writes text format with timestamp, padded level and request id', async () => {
    const transport = new FileTransport({ name: 'file', filename, format: 'text' });

    await transport.log(entry('text line'));

    const line = readFileSync(filename, 'utf8').trim();
    expect(line).toBe('2024-01-01T00:00:00.000Z [INFO   ] [req-1] text line');
  });

  test('writes one JSON object per line in json format', async () => {
    const transport = new FileTransport({ name: 'file', filename, format: 'json' });

    await transport.log(entry('first'));
    await transport.log(entry('second', 'error'));

    const lines = readFileSync(filename, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!)).toEqual({
      timestamp: '2024-01-01T00:00:00.000Z',
      level: 'info',
      message: 'first',
      context: { service: 'api' },
      requestId: 'req-1',
    });
    expect(JSON.parse(lines[1]!).level).toBe('error');
  });

  test('appends to an existing file rather than truncating it', async () => {
    writeFileSync(filename, 'pre-existing\n', 'utf8');
    const transport = new FileTransport({ name: 'file', filename, format: 'text' });

    await transport.log(entry('appended'));

    const contents = readFileSync(filename, 'utf8');
    expect(contents).toContain('pre-existing');
    expect(contents).toContain('appended');
  });

  test('rotates the file once maxSize is exceeded', async () => {
    const transport = new FileTransport({
      name: 'file',
      filename,
      format: 'text',
      maxSize: 200,
      maxFiles: 3,
    });

    for (let i = 0; i < 10; i++) {
      await transport.log(entry(`entry-${i}`));
    }

    expect(existsSync(join(dir, 'app.1.log'))).toBe(true);
    expect(readFileSync(join(dir, 'app.1.log'), 'utf8')).toContain('entry-');
  });

  test('keeps at most maxFiles rotations and discards the oldest', async () => {
    const transport = new FileTransport({
      name: 'file',
      filename,
      format: 'text',
      maxSize: 100,
      maxFiles: 3,
    });

    for (let i = 0; i < 40; i++) {
      await transport.log(entry(`entry-${i}`));
    }

    expect(existsSync(join(dir, 'app.1.log'))).toBe(true);
    expect(existsSync(join(dir, 'app.2.log'))).toBe(true);
    // maxFiles: 3 means the current file plus rotations 1 and 2.
    expect(existsSync(join(dir, 'app.3.log'))).toBe(false);
  });

  test('does not rotate when maxSize is unset', async () => {
    const transport = new FileTransport({ name: 'file', filename, format: 'text' });

    for (let i = 0; i < 200; i++) {
      await transport.log(entry(`entry-${i}`));
    }

    expect(existsSync(join(dir, 'app.1.log'))).toBe(false);
    expect(readFileSync(filename, 'utf8').trim().split('\n')).toHaveLength(200);
  });

  test('flush drains entries queued during an in-flight write', async () => {
    const transport = new FileTransport({ name: 'file', filename, format: 'text' });

    for (let i = 0; i < 30; i++) {
      void transport.log(entry(`queued-${i}`));
    }
    await transport.flush();

    expect(readFileSync(filename, 'utf8').trim().split('\n')).toHaveLength(30);
  });

  test('reports write failures through onError', async () => {
    const errors: unknown[] = [];
    // A directory cannot be appended to, so the write fails.
    const transport = new FileTransport({
      name: 'file',
      filename: dir,
      format: 'text',
      onError: error => errors.push(error),
    });

    await transport.log(entry('doomed'));

    expect(errors).toHaveLength(1);
  });
});
