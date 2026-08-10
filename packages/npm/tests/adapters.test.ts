import { describe, test, expect } from 'bun:test';
import { createPlip } from '../src/core/index.js';
import { NextJSAdapter, ReactAdapter, createReactLogger } from '../src/adapters/index.js';
import type { RequestLike } from '../src/adapters/nextjs.js';
import type { FormattedLogEntry } from '../src/types/config.js';
import type { Logger } from '../src/types/logger.js';

function capturingLogger(): { logger: Logger; entries: FormattedLogEntry[] } {
  const entries: FormattedLogEntry[] = [];
  const logger = createPlip({ devOnly: false, enableColors: false });
  logger.clearTransports();
  logger.addTransport({ name: 'capture', log: entry => { entries.push(entry); } });
  return { logger, entries };
}

describe('ReactAdapter', () => {
  test('useLogger attaches the component name as context', () => {
    const { logger, entries } = capturingLogger();
    const adapter = new ReactAdapter(logger);

    adapter.useLogger('UserCard').info('rendered');

    expect(entries[0]!.context).toEqual({ component: 'UserCard' });
  });

  test('useLogger returns the base logger when nothing would be added', () => {
    const { logger } = capturingLogger();
    const adapter = new ReactAdapter(logger, { includeComponentName: false, includeProps: false });

    expect(adapter.useLogger('UserCard')).toBe(logger);
  });

  test('props are redacted and simplified when included', () => {
    const { logger, entries } = capturingLogger();
    const adapter = new ReactAdapter(logger, { includeProps: true });

    adapter.useLogger('Login', {
      password: 'hunter2',
      authToken: 'abc',
      onClick: () => {},
      user: { id: 1 },
      label: 'Sign in',
    }).info('rendered');

    expect(entries[0]!.context!['props']).toEqual({
      password: '[REDACTED]',
      authToken: '[REDACTED]',
      onClick: '[Function]',
      user: '[Object]',
      label: 'Sign in',
    });
  });

  test('withErrorBoundary logs the component stack', () => {
    const { logger, entries } = capturingLogger();
    const adapter = new ReactAdapter(logger);

    adapter.withErrorBoundary('Page').onError(new Error('render failed'), {
      componentStack: 'at Page',
    });

    expect(entries[0]!.level).toBe('error');
    expect(entries[0]!.message).toContain('React Error Boundary: Page');
    expect(entries[0]!.message).toContain('render failed');
    expect(entries[0]!.message).toContain('at Page');
  });

  test('lifecycle hooks are inert unless logLifecycle is enabled', () => {
    const { logger, entries } = capturingLogger();

    expect(new ReactAdapter(logger).withLifecycle('Widget')).toEqual({});

    const adapter = new ReactAdapter(logger, { logLifecycle: true, includeProps: true });
    const lifecycle = adapter.withLifecycle('Widget');
    lifecycle.onMount!({ id: 1 });
    lifecycle.onUpdate!({ id: 1 }, { id: 2 });
    lifecycle.onUnmount!();

    expect(entries.map(e => e.message.split(' ').slice(0, 2).join(' '))).toEqual([
      'Component mounted:',
      'Component updated:',
      'Component unmounted:',
    ]);
  });

  test('withPerformance times a render', () => {
    const { logger, entries } = capturingLogger();
    const adapter = new ReactAdapter(logger);
    const perf = adapter.withPerformance('Chart');

    const timer = perf.startRender();
    perf.endRender(timer);

    expect(timer.label).toBe('Chart-render');
    expect(entries[0]!.message).toContain('Component Chart render completed');
    expect(entries[0]!.message).toMatch(/\(\d+\.\d{2}ms\)/);
  });

  test('createReactLogger exposes the adapter surface', () => {
    const { logger, entries } = capturingLogger();
    const react = createReactLogger(logger, { logLifecycle: true });

    react.useLogger('Nav').info('hi');
    react.withLifecycle('Nav').onMount!();
    react.withErrorBoundary('Nav').onError(new Error('x'), { componentStack: '' });
    expect(react.withPerformance('Nav').startRender().label).toBe('Nav-render');

    expect(entries).toHaveLength(3);
  });
});

describe('NextJSAdapter', () => {
  const request = (overrides: Partial<RequestLike> = {}): RequestLike => ({
    method: 'GET',
    url: 'https://app.dev/api/users',
    headers: new Headers({
      'user-agent': 'test-agent',
      'x-forwarded-for': '203.0.113.1',
      authorization: 'Bearer secret',
      cookie: 'session=abc',
      'x-custom': 'keep',
    }),
    nextUrl: { pathname: '/api/users' },
    ...overrides,
  });

  test('withRequest adds method, url and pathname', () => {
    const { logger, entries } = capturingLogger();

    new NextJSAdapter(logger).withRequest(request()).info('handled');

    expect(entries[0]!.context).toMatchObject({
      method: 'GET',
      url: 'https://app.dev/api/users',
      pathname: '/api/users',
    });
  });

  test('withRequest returns the base logger when disabled', () => {
    const { logger } = capturingLogger();
    const adapter = new NextJSAdapter(logger, { includeRequestInfo: false });

    expect(adapter.withRequest(request())).toBe(logger);
  });

  test('sensitive headers are redacted', () => {
    const { logger, entries } = capturingLogger();

    new NextJSAdapter(logger).withRequest(request()).info('handled');

    const headers = entries[0]!.context!['headers'];
    expect(headers.authorization).toBe('[REDACTED]');
    expect(headers.cookie).toBe('[REDACTED]');
    expect(headers['x-custom']).toBe('keep');
  });

  test('reads headers from a Map and from a plain object', () => {
    const { logger, entries } = capturingLogger();
    const adapter = new NextJSAdapter(logger, { includeUserAgent: true, sanitizeHeaders: false });

    adapter.withRequest(request({ headers: new Map([['user-agent', 'from-map']]) })).info('a');
    adapter.withRequest(request({ headers: { 'user-agent': 'from-object' } })).info('b');

    expect(entries[0]!.context!['userAgent']).toBe('from-map');
    expect(entries[1]!.context!['userAgent']).toBe('from-object');
  });

  test('falls back to forwarding headers for the client ip', () => {
    const { logger, entries } = capturingLogger();
    const adapter = new NextJSAdapter(logger, { includeIP: true });

    adapter.withRequest(request()).info('a');
    adapter.withRequest(request({ ip: '198.51.100.9' })).info('b');

    expect(entries[0]!.context!['ip']).toBe('203.0.113.1');
    expect(entries[1]!.context!['ip']).toBe('198.51.100.9');
  });

  test('an inbound x-request-id wins over a generated one', () => {
    const { logger, entries } = capturingLogger();
    const headers = new Headers({ 'x-request-id': 'inbound-id' });

    new NextJSAdapter(logger).withRequest(request({ headers })).info('a');
    new NextJSAdapter(logger).withRequest(request()).info('b');

    expect(entries[0]!.context!['requestId']).toBe('inbound-id');
    expect(entries[1]!.context!['requestId']).toMatch(/^req_\d+_/);
  });

  test('middleware logs start and completion', () => {
    const { logger, entries } = capturingLogger();
    const handle = new NextJSAdapter(logger).middleware();

    const { onComplete } = handle(request());
    onComplete(201);

    expect(entries[0]!.message).toContain('Request started');
    expect(entries[1]!.level).toBe('success');
    expect(entries[1]!.message).toContain('Request completed');
  });

  test('middleware reports a failure as an error', () => {
    const { logger, entries } = capturingLogger();
    const handle = new NextJSAdapter(logger).middleware();

    handle(request()).onComplete(undefined, new Error('handler blew up'));

    expect(entries[1]!.level).toBe('error');
    expect(entries[1]!.message).toContain('Request failed');
    expect(entries[1]!.message).toContain('handler blew up');
  });

  test('withAPIRoute logs success and rethrows failures', async () => {
    const { logger, entries } = capturingLogger();
    const adapter = new NextJSAdapter(logger);

    const ok = adapter.withAPIRoute(async () => 'result');
    expect(await ok(request())).toBe('result');
    expect(entries[1]!.level).toBe('success');

    const bad = adapter.withAPIRoute(async () => {
      throw new Error('route failed');
    });
    await expect(bad(request())).rejects.toThrow('route failed');
    expect(entries[3]!.level).toBe('error');
    expect(entries[3]!.message).toContain('route failed');
  });
});
