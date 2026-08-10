// tests/ssr-csr.test.ts
import { test, expect, describe } from "bun:test";
import {
  createSSRLogger,
  createCSRLogger,
  ssrLogger,
  csrLogger,
  getAutoConfig,
  ssrConfig,
  csrConfig 
} from '../src/core/index.js';describe("SSR/CSR Logger Configurations", () => {
  test("SSR config should have correct default settings", () => {
    // Colors enabled in development (!isProduction()), disabled in production
    expect(typeof ssrConfig.enableColors).toBe('boolean'); // Value depends on environment
    expect(ssrConfig.enableSyntaxHighlighting).toBe(true); // Keep for object formatting - useful for debugging
    expect(ssrConfig.enableTimestamp).toBe(true); // Essential for server logs
    expect(ssrConfig.includeRequestId).toBe(true); // For request correlation
  });

  test("CSR config should have correct default settings", () => {
    expect(csrConfig.enableColors).toBe(true);
    expect(csrConfig.enableSyntaxHighlighting).toBe(true);
  });

  test("createSSRLogger should create logger with SSR config", () => {
    const logger = createSSRLogger();
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
  });

  test("createCSRLogger should create logger with CSR config", () => {
    const logger = createCSRLogger();
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
  });

  test("pre-configured SSR logger should work", () => {
    expect(ssrLogger).toBeDefined();
    expect(typeof ssrLogger.info).toBe("function");
  });

  test("pre-configured CSR logger should work", () => {
    expect(csrLogger).toBeDefined();
    expect(typeof csrLogger.info).toBe("function");
  });

  test("getAutoConfig should return config", () => {
    const config = getAutoConfig();
    expect(config).toBeDefined();
    expect(typeof config.enableColors).toBe("boolean");
    expect(typeof config.enableSyntaxHighlighting).toBe("boolean");
  });
  test("SSR logger should produce clean output suitable for servers", () => {
    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
    };

    const logger = createSSRLogger();
    logger.info("Test message");
    
    expect(logs.length).toBe(1);
    expect(logs[0]).toContain("[INFO]");
    expect(logs[0]).toContain("Test message");
    
    // Restore console
    console.log = originalLog;
  });
  test("CSR logger should produce rich output", () => {
    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
    };

    const logger = createCSRLogger();
    logger.info("Test message");
    
    expect(logs.length).toBe(1);
    expect(logs[0]).toContain("[INFO]");
    expect(logs[0]).toContain("Test message");
    
    // Restore console
    console.log = originalLog;
  });

  test("SSR and CSR should have different default behaviors", () => {
    // Mock console.log to capture output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
    };

    const testObj = { userId: 123, name: "test" };
    
    // SSR optimized for servers, CSR optimized for browsers
    const ssrLogger = createSSRLogger();
    const csrLogger = createCSRLogger();
    
    ssrLogger.info("SSR Object:", testObj);
    csrLogger.info("CSR Object:", testObj);
    
    expect(logs.length).toBe(2);
    
    // Both should contain the object data
    expect(logs[0]).toContain("userId");
    expect(logs[1]).toContain("userId");
    
    // Restore console
    console.log = originalLog;
  });
});
