import type { FileTransportConfig } from '../types/transport.js';
import type { FormattedLogEntry } from '../types/config.js';
import { BaseTransport } from '../core/transport.js';
import { JsonFormatter } from '../formatters/json.js';
import { TextFormatter } from '../formatters/text.js';

type FsModule = typeof import('fs');
type PathModule = typeof import('path');

const DEFAULT_MAX_FILES = 5;

export class FileTransport extends BaseTransport {
  private formatter: JsonFormatter | TextFormatter;
  private writeQueue: string[] = [];
  private pending: Promise<void> = Promise.resolve();

  constructor(config: FileTransportConfig) {
    super(config);

    if (config.format === 'json') {
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

  log(entry: FormattedLogEntry): Promise<void> {
    const formattedEntry = this.formatter.format(entry);
    this.writeQueue.push(formattedEntry + '\n');

    // Chain onto the in-flight write instead of dropping the entry: awaiting
    // log() must guarantee this entry reached the file.
    return this.flushQueue();
  }

  private flushQueue(): Promise<void> {
    this.pending = this.pending.then(() => this.drain());
    return this.pending;
  }

  private async drain(): Promise<void> {
    if (this.writeQueue.length === 0) return;

    const config = this.config as FileTransportConfig;

    // Take only what we have now; entries appended while we await stay queued
    // for the next drain rather than being wiped.
    const batch = this.writeQueue.splice(0, this.writeQueue.length);

    try {
      if (typeof process !== 'undefined' && process.versions?.node) {
        const fs = await import('fs');
        const path = await import('path');

        const dir = path.dirname(config.filename);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        await fs.promises.appendFile(config.filename, batch.join(''), 'utf8');

        this.checkRotation(fs, path);
      } else {
        console.warn('FileTransport: File writing not supported in this environment');
      }
    } catch (error) {
      this.reportError(error);
    }
  }

  private checkRotation(fs: FsModule, path: PathModule): void {
    const config = this.config as FileTransportConfig;

    if (!config.maxSize) return;

    if (!fs.existsSync(config.filename)) return;

    if (fs.statSync(config.filename).size > config.maxSize) {
      this.rotateFile(fs, path);
    }
  }

  private rotateFile(fs: FsModule, path: PathModule): void {
    const config = this.config as FileTransportConfig;
    const maxFiles = config.maxFiles || DEFAULT_MAX_FILES;
    const { dir, name, ext } = path.parse(config.filename);

    for (let i = maxFiles - 1; i > 0; i--) {
      const oldFile = path.join(dir, `${name}.${i}${ext}`);
      const newFile = path.join(dir, `${name}.${i + 1}${ext}`);

      if (fs.existsSync(oldFile)) {
        if (i === maxFiles - 1) {
          fs.unlinkSync(oldFile);
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    const rotatedFile = path.join(dir, `${name}.1${ext}`);
    if (fs.existsSync(config.filename)) {
      fs.renameSync(config.filename, rotatedFile);
    }
  }

  /**
   * Drains repeatedly: entries can be appended while an earlier write awaits.
   * Called by `Logger.flush()`.
   */
  async flush(): Promise<void> {
    while (this.writeQueue.length > 0) {
      await this.flushQueue();
    }
    await this.pending;
  }

  async close(): Promise<void> {
    await this.flush();
  }
}
