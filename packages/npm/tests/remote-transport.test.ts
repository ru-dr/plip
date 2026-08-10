import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { RemoteTransport } from '../src/transports/remote.js';
import type { FormattedLogEntry, LogLevel } from '../src/types/config.js';

interface Call {
  url: string;
  init: RequestInit;
  body: any;
}

const originalFetch = globalThis.fetch;

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

describe('RemoteTransport', () => {
  let calls: Call[] = [];
  let respond: () => Response;

  beforeEach(() => {
    calls = [];
    respond = () => new Response('', { status: 200 });
    globalThis.fetch = (async (url: any, init: any) => {
      calls.push({ url: String(url), init, body: JSON.parse(init.body) });
      return respond();
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('buffers until batchSize is reached, then posts one batch', async () => {
    const transport = new RemoteTransport({
      name: 'remote',
      url: 'https://logs.example.com/ingest',
      batchSize: 3,
    });

    transport.log(entry('one'));
    transport.log(entry('two'));
    expect(calls).toHaveLength(0);
    expect(transport.getBatchSize()).toBe(2);

    transport.log(entry('three'));
    await transport.flush();

    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://logs.example.com/ingest');
    expect(calls[0]!.init.method).toBe('POST');
    expect(calls[0]!.body.logs).toHaveLength(3);
    expect(transport.getBatchSize()).toBe(0);

    await transport.close();
  });

  test('serializes the entry fields the remote endpoint needs', async () => {
    const transport = new RemoteTransport({ name: 'remote', url: 'https://x.dev' });

    transport.log(entry('payload check', 'warn'));
    await transport.flush();

    const [log] = calls[0]!.body.logs;
    expect(log).toEqual({
      timestamp: '2024-01-01T00:00:00.000Z',
      level: 'warn',
      message: 'payload check',
      context: { service: 'api' },
      requestId: 'req-1',
    });
    expect(typeof calls[0]!.body.timestamp).toBe('number');

    await transport.close();
  });

  test('sends the api key as a bearer token alongside custom headers', async () => {
    const transport = new RemoteTransport({
      name: 'remote',
      url: 'https://x.dev',
      apiKey: 'secret-token',
      headers: { 'X-Tenant': 'acme' },
    });

    transport.log(entry('auth'));
    await transport.flush();

    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer secret-token');
    expect(headers['X-Tenant']).toBe('acme');
    expect(headers['Content-Type']).toBe('application/json');

    await transport.close();
  });

  test('requeues logs ahead of newer ones when delivery fails', async () => {
    const errors: unknown[] = [];
    const transport = new RemoteTransport({
      name: 'remote',
      url: 'https://x.dev',
      onError: error => errors.push(error),
    });

    respond = () => new Response('nope', { status: 500, statusText: 'Server Error' });
    transport.log(entry('first'));
    await transport.flush();

    expect(errors).toHaveLength(1);
    expect(String(errors[0])).toContain('500');
    expect(transport.getBatchSize()).toBe(1);

    respond = () => new Response('', { status: 200 });
    transport.log(entry('second'));
    await transport.flush();

    expect(calls).toHaveLength(2);
    expect(calls[1]!.body.logs.map((l: any) => l.message)).toEqual(['first', 'second']);

    await transport.close();
  });

  test('caps the retry buffer so a dead endpoint cannot leak memory', async () => {
    const transport = new RemoteTransport({
      name: 'remote',
      url: 'https://x.dev',
      batchSize: 100000,
      onError: () => {},
    });

    respond = () => new Response('', { status: 503 });

    for (let i = 0; i < 1200; i++) {
      transport.log(entry(`entry-${i}`));
    }
    await transport.flush();

    expect(transport.getBatchSize()).toBe(1000);

    await transport.close();
  });

  test('aborts a request that exceeds the timeout', async () => {
    const errors: unknown[] = [];
    globalThis.fetch = ((_url: any, init: any) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('aborted')));
      })) as typeof fetch;

    const transport = new RemoteTransport({
      name: 'remote',
      url: 'https://x.dev',
      timeout: 10,
      onError: error => errors.push(error),
    });

    transport.log(entry('slow'));
    await transport.flush();

    expect(errors).toHaveLength(1);
    expect(transport.getBatchSize()).toBe(1);

    await transport.close();
  });

  test('close stops the interval timer and drains the buffer', async () => {
    const transport = new RemoteTransport({
      name: 'remote',
      url: 'https://x.dev',
      batchSize: 50,
      flushInterval: 5,
    });

    transport.log(entry('pending'));
    await transport.close();

    expect(calls).toHaveLength(1);
    expect(transport.getBatchSize()).toBe(0);

    const before = calls.length;
    await new Promise(resolve => setTimeout(resolve, 25));
    expect(calls).toHaveLength(before);
  });

  test('the interval timer flushes buffered entries', async () => {
    const transport = new RemoteTransport({
      name: 'remote',
      url: 'https://x.dev',
      batchSize: 50,
      flushInterval: 10,
    });

    transport.log(entry('timed'));
    await new Promise(resolve => setTimeout(resolve, 40));

    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls[0]!.body.logs[0].message).toBe('timed');

    await transport.close();
  });

  test('an empty buffer sends nothing', async () => {
    const transport = new RemoteTransport({ name: 'remote', url: 'https://x.dev' });

    await transport.flush();

    expect(calls).toHaveLength(0);
    await transport.close();
  });
});
