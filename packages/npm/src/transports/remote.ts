import type { RemoteTransportConfig } from '../types/transport.js';
import type { FormattedLogEntry } from '../types/config.js';
import { BaseTransport } from '../core/transport.js';

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_FLUSH_INTERVAL = 5000;
const MAX_BUFFERED_LOGS = 1000;

interface RemoteLogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  requestId?: string;
}

interface LogBatch {
  logs: RemoteLogEntry[];
  timestamp: number;
}

export class RemoteTransport extends BaseTransport {
  private batch: RemoteLogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: RemoteTransportConfig) {
    super(config);
    this.startFlushTimer();
  }

  log(entry: FormattedLogEntry): void {
    const config = this.config as RemoteTransportConfig;

    this.batch.push({
      timestamp: entry.timestamp.toISOString(),
      level: entry.level,
      message: entry.message,
      context: entry.context,
      requestId: entry.requestId,
    });

    if (this.batch.length >= (config.batchSize || DEFAULT_BATCH_SIZE)) {
      void this.send();
    }
  }

  private startFlushTimer(): void {
    const config = this.config as RemoteTransportConfig;
    const interval = config.flushInterval || DEFAULT_FLUSH_INTERVAL;

    this.flushTimer = setInterval(() => {
      void this.send();
    }, interval);

    // Never keep a Node process alive just to flush logs.
    (this.flushTimer as any)?.unref?.();
  }

  private async send(): Promise<void> {
    if (this.batch.length === 0) return;

    const config = this.config as RemoteTransportConfig;
    const logsToSend = this.batch;
    this.batch = [];

    const payload: LogBatch = { logs: logsToSend, timestamp: Date.now() };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const controller = config.timeout ? new AbortController() : null;
    const timeoutId = controller
      ? setTimeout(() => controller.abort(), config.timeout)
      : null;

    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller?.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Requeue ahead of newer entries so ordering survives a retry, then cap
      // the buffer so a persistently failing endpoint cannot leak memory.
      this.batch.unshift(...logsToSend);
      if (this.batch.length > MAX_BUFFERED_LOGS) {
        this.batch = this.batch.slice(-MAX_BUFFERED_LOGS);
      }

      this.reportError(error);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.send();
  }

  /** @deprecated Use `flush()`. */
  async forceFlush(): Promise<void> {
    await this.send();
  }

  /** Called by `Logger.flush()`. */
  async flush(): Promise<void> {
    await this.send();
  }

  getBatchSize(): number {
    return this.batch.length;
  }
}
