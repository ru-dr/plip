// src/transports/file.ts

import type { FileTransportConfig } from '../types/transport.js';
import type { FormattedLogEntry } from '../types/config.js';
import { BaseTransport } from '../core/transport.js';
import { JsonFormatter } from '../formatters/json.js';
import { TextFormatter } from '../formatters/text.js';

export class FileTransport extends BaseTransport {
  private formatter: JsonFormatter | TextFormatter;
  private writeQueue: string[] = [];
  private isWriting = false;

  constructor(config: FileTransportConfig) {
    super(config);
    
    const fileConfig = config as FileTransportConfig;
    if (fileConfig.format === 'json') {
      this.formatter = new JsonFormatter({
        includeTimestamp: true,
        includeLevel: true,
        includeMessage: true,
        includeContext: true,
        includeRequestId: true,
        pretty: false,
      });
    } else {
      this.formatter = new TextFormatter({
        includeTimestamp: true,
        includeLevel: true,
        includeRequestId: true,
        timestampFormat: 'iso',
      });
    }
  }

  async log(entry: FormattedLogEntry): Promise<void> {
    const formattedEntry = this.formatter.format(entry);
    this.writeQueue.push(formattedEntry + '\n');
    
    if (!this.isWriting) {
      await this.flushQueue();
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.writeQueue.length === 0 || this.isWriting) return;
    
    this.isWriting = true;
    const config = this.config as FileTransportConfig;
    
    try {
      // Check if running in Node.js environment
      if (typeof process !== 'undefined' && process.versions?.node) {
        // Dynamic import for Node.js fs module
        const fs = await import('fs');
        const path = await import('path');
        
        // Ensure directory exists
        const dir = path.dirname(config.filename);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write queued entries
        const content = this.writeQueue.join('');
        fs.appendFileSync(config.filename, content, 'utf8');
        
        // Check file rotation if needed
        await this.checkRotation(fs, path);
      } else {
        // In browser or other environments, we can't write to files
        console.warn('FileTransport: File writing not supported in this environment');
      }
    } catch (error) {
      console.error('FileTransport: Failed to write to file:', error);
    } finally {
      this.writeQueue = [];
      this.isWriting = false;
    }
  }

  private async checkRotation(fs: any, path: any): Promise<void> {
    const config = this.config as FileTransportConfig;
    
    if (!config.maxSize) return;
    
    try {
      const stats = fs.statSync(config.filename);
      if (stats.size > config.maxSize) {
        await this.rotateFile(fs, path);
      }
    } catch (error) {
      // File doesn't exist yet, no rotation needed
    }
  }

  private async rotateFile(fs: any, path: any): Promise<void> {
    const config = this.config as FileTransportConfig;
    const maxFiles = config.maxFiles || 5;
    const { dir, name, ext } = path.parse(config.filename);
    
    // Rotate existing files
    for (let i = maxFiles - 1; i > 0; i--) {
      const oldFile = path.join(dir, `${name}.${i}${ext}`);
      const newFile = path.join(dir, `${name}.${i + 1}${ext}`);
      
      if (fs.existsSync(oldFile)) {
        if (i === maxFiles - 1) {
          fs.unlinkSync(oldFile); // Remove oldest file
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }
    
    // Move current file to .1
    const rotatedFile = path.join(dir, `${name}.1${ext}`);
    if (fs.existsSync(config.filename)) {
      fs.renameSync(config.filename, rotatedFile);
    }
  }

  async close(): Promise<void> {
    await this.flushQueue();
  }
}