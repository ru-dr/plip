// src/transports/remote.ts

import type { RemoteTransportConfig } from '../types/transport.js';
import type { FormattedLogEntry } from '../types/config.js';
import { BaseTransport } from '../core/transport.js';
import { JsonFormatter } from '../formatters/json.js';

interface LogBatch {
  logs: any[];
  timestamp: number;
}

export class RemoteTransport extends BaseTransport {
  private formatter: JsonFormatter;
  private batch: any[] = [];
  private flushTimer: NodeJS.Timeout | number | null = null;

  constructor(config: RemoteTransportConfig) {
    super(config);
    
    this.formatter = new JsonFormatter({
      includeTimestamp: true,
      includeLevel: true,
      includeMessage: true,
      includeContext: true,
      includeRequestId: true,
      pretty: false,
    });

    // Start flush timer
    this.startFlushTimer();
  }

  log(entry: FormattedLogEntry): void {
    const config = this.config as RemoteTransportConfig;
    
    // Add to batch
    const logData = JSON.parse(this.formatter.format(entry));
    this.batch.push(logData);

    // Flush if batch is full
    if (this.batch.length >= (config.batchSize || 10)) {
      this.flush();
    }
  }

  private startFlushTimer(): void {
    const config = this.config as RemoteTransportConfig;
    const interval = config.flushInterval || 5000; // 5 seconds default

    this.flushTimer = setInterval(() => {
      if (this.batch.length > 0) {
        this.flush();
      }
    }, interval);
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const config = this.config as RemoteTransportConfig;
    const logsToSend = [...this.batch];
    this.batch = [];

    const payload: LogBatch = {
      logs: logsToSend,
      timestamp: Date.now(),
    };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
      };

      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const fetchOptions: RequestInit = {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      };

      if (config.timeout) {
        // Add timeout using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        fetchOptions.signal = controller.signal;
        
        try {
          const response = await fetch(config.url, fetchOptions);
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      } else {
        const response = await fetch(config.url, fetchOptions);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
    } catch (error) {
      // Re-add failed logs to the beginning of the batch for retry
      this.batch.unshift(...logsToSend);
      console.error('RemoteTransport: Failed to send logs:', error);
      
      // Prevent infinite growth of failed logs
      if (this.batch.length > 1000) {
        this.batch = this.batch.slice(-500); // Keep only the last 500 logs
      }
    }
  }

  async close(): Promise<void> {
    // Clear the flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer as NodeJS.Timeout);
      this.flushTimer = null;
    }

    // Flush any remaining logs
    if (this.batch.length > 0) {
      await this.flush();
    }
  }

  // Manual flush method
  async forceFlush(): Promise<void> {
    await this.flush();
  }

  // Get the current batch size
  getBatchSize(): number {
    return this.batch.length;
  }
}