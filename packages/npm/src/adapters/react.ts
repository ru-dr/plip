// src/adapters/react.ts

import type { Logger } from '../types/logger.js';

export interface ReactLoggerOptions {
  includeComponentName?: boolean;
  includeProps?: boolean;
  sanitizeProps?: boolean;
  logLifecycle?: boolean;
}

export class ReactAdapter {
  private logger: Logger;
  private options: ReactLoggerOptions;

  constructor(logger: Logger, options: ReactLoggerOptions = {}) {
    this.logger = logger;
    this.options = {
      includeComponentName: true,
      includeProps: false,
      sanitizeProps: true,
      logLifecycle: false,
      ...options,
    };
  }

  // Hook for component logging
  useLogger(componentName?: string, props?: Record<string, any>): Logger {
    if (!this.options.includeComponentName && !this.options.includeProps) {
      return this.logger;
    }

    const context: Record<string, any> = {};

    if (this.options.includeComponentName && componentName) {
      context.component = componentName;
    }

    if (this.options.includeProps && props) {
      context.props = this.options.sanitizeProps ? this.sanitizeProps(props) : props;
    }

    return this.logger.withContext(context);
  }

  // Error boundary integration
  withErrorBoundary(componentName: string) {
    return {
      onError: (error: Error, errorInfo: { componentStack: string }) => {
        this.logger.error(`React Error Boundary: ${componentName}`, {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          component: componentName,
        });
      },
    };
  }

  // Component lifecycle logging
  withLifecycle(componentName: string) {
    if (!this.options.logLifecycle) {
      return {};
    }

    const componentLogger = this.logger.withContext({ component: componentName });

    return {
      onMount: (props?: Record<string, any>) => {
        componentLogger.debug(`Component mounted: ${componentName}`, 
          this.options.includeProps && props ? { props: this.sanitizeProps(props) } : {}
        );
      },
      onUpdate: (prevProps?: Record<string, any>, nextProps?: Record<string, any>) => {
        if (this.options.includeProps && prevProps && nextProps) {
          componentLogger.debug(`Component updated: ${componentName}`, {
            prevProps: this.sanitizeProps(prevProps),
            nextProps: this.sanitizeProps(nextProps),
          });
        } else {
          componentLogger.debug(`Component updated: ${componentName}`);
        }
      },
      onUnmount: () => {
        componentLogger.debug(`Component unmounted: ${componentName}`);
      },
    };
  }

  // Performance tracking for components
  withPerformance(componentName: string) {
    return {
      startRender: () => {
        return this.logger.startTimer(`${componentName}-render`);
      },
      endRender: (timer: any, props?: Record<string, any>) => {
        const context: Record<string, any> = { component: componentName };
        if (this.options.includeProps && props) {
          context.props = this.sanitizeProps(props);
        }
        
        timer.end(`Component ${componentName} render completed`);
      },
    };
  }

  private sanitizeProps(props: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];

    for (const [key, value] of Object.entries(props)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'function') {
        sanitized[key] = '[Function]';
      } else if (value && typeof value === 'object') {
        // Avoid deep serialization of complex objects
        sanitized[key] = '[Object]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// Hook factory for easier integration
export function createReactLogger(logger: Logger, options?: ReactLoggerOptions) {
  const adapter = new ReactAdapter(logger, options);
  
  return {
    useLogger: (componentName?: string, props?: Record<string, any>) => 
      adapter.useLogger(componentName, props),
    
    withErrorBoundary: (componentName: string) => 
      adapter.withErrorBoundary(componentName),
    
    withLifecycle: (componentName: string) => 
      adapter.withLifecycle(componentName),
    
    withPerformance: (componentName: string) => 
      adapter.withPerformance(componentName),
  };
}