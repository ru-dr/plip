export interface PerformanceTimer {
  label: string;
  start(): void;
  end(): number;
  elapsed(): number;
}

export class Timer implements PerformanceTimer {
  public label: string;
  private startTime: number = 0;
  private endTime: number = 0;

  constructor(label: string) {
    this.label = label;
  }

  start(): void {
    this.startTime = this.getHighResTime();
  }

  end(): number {
    this.endTime = this.getHighResTime();
    return this.elapsed();
  }

  elapsed(): number {
    const end = this.endTime || this.getHighResTime();
    return end - this.startTime;
  }

  private getHighResTime(): number {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now();
    } else {
      return Date.now();
    }
  }
}

export class MemoryUsage {
  static getUsage(): {
    used: number;
    total: number;
    percentage: number;
  } | null {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        used: usage.heapUsed,
        total: usage.heapTotal,
        percentage: (usage.heapUsed / usage.heapTotal) * 100,
      };
    }

    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      };
    }

    return null;
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export interface Metrics {
  timers: Record<string, number>;
  counters: Record<string, number>;
  gauges: Record<string, number>;
}

export class MetricsCollector {
  private metrics: Metrics = {
    timers: {},
    counters: {},
    gauges: {},
  };

  addTimer(name: string, duration: number): void {
    this.metrics.timers[name] = duration;
  }

  incrementCounter(name: string, value: number = 1): void {
    this.metrics.counters[name] = (this.metrics.counters[name] || 0) + value;
  }

  setGauge(name: string, value: number): void {
    this.metrics.gauges[name] = value;
  }

  getMetrics(): Metrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      timers: {},
      counters: {},
      gauges: {},
    };
  }
}
