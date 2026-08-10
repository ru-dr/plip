// tests/logger.test.ts
import { test, expect, describe, beforeEach, afterEach } from "bun:test";
import { plip, createPlip } from '../src/core/index.js';
import { colors, hasColors } from "../src/utils/colors.js";

// Mock console.log to capture output
let consoleLogs: string[] = [];
const originalLog = console.log;

beforeEach(() => {
  consoleLogs = [];
  console.log = (...args: any[]) => {
    consoleLogs.push(args.join(" "));
  };
});

afterEach(() => {
  console.log = originalLog;
});

describe("plip logger", () => {
  test("basic logging methods work", () => {
    const logger = createPlip({ devOnly: false });
    
    logger.info("test info");
    logger.warn("test warn");
    logger.error("test error");
    logger.success("test success");
    logger.debug("test debug");
    logger.trace("test trace");
    logger.verbose("test verbose");

    expect(consoleLogs).toHaveLength(7);
    expect(consoleLogs[0]).toContain("[INFO]");
    expect(consoleLogs[0]).toContain("test info");
    expect(consoleLogs[1]).toContain("[WARN]");
    expect(consoleLogs[2]).toContain("[ERROR]");
    expect(consoleLogs[3]).toContain("[SUCCESS]");
    expect(consoleLogs[4]).toContain("[DEBUG]");
    expect(consoleLogs[5]).toContain("[TRACE]");
    expect(consoleLogs[6]).toContain("[VERBOSE]");
  });

  test("silent mode suppresses all logs", () => {
    const logger = createPlip({ silent: true, devOnly: false });
    
    logger.info("test");
    logger.error("test");
    
    expect(consoleLogs).toHaveLength(0);
  });

  test("can disable colors", () => {
    const logger = createPlip({ enableColors: false, devOnly: false });
    
    logger.info("test");
    
    expect(consoleLogs[0]).not.toContain("\x1b[36m");
    expect(consoleLogs[0]).toContain("[INFO]");
  });

  test("can customize theme", () => {
    const logger = createPlip({
      devOnly: false,
      theme: {
        colors: {
            info: colors.magenta,
            warn: colors.dim,
            error: colors.dim,
            success: colors.dim,
            debug: colors.dim,
            trace: colors.dim,
            verbose: colors.dim
        },        dimColors: {
            info: (text: string) => colors.magenta(colors.gray(text)),
            warn: colors.dim,
            error: colors.dim,
            success: colors.dim,
            debug: colors.dim,
            trace: colors.dim,
            verbose: colors.dim
        }
      }
    });
    
    logger.info("test");
    expect(consoleLogs[0]).toContain("[INFO]");
    expect(hasColors(consoleLogs[0] || "")).toBe(true);
  });

  test("can filter enabled levels", () => {
    const logger = createPlip({ 
      enabledLevels: ["error", "warn"], 
      devOnly: false 
    });
    
    logger.info("should not show");
    logger.warn("should show");
    logger.error("should show");
    logger.debug("should not show");
    
    expect(consoleLogs).toHaveLength(2);
    expect(consoleLogs[0]).toContain("[WARN]");
    expect(consoleLogs[1]).toContain("[ERROR]");
  });

  test("fluent API works", () => {
    const logger = createPlip({ devOnly: false })
      .withColors(false)
      .levels("info", "error");
    
    logger.info("test info");
    logger.warn("test warn");
    logger.error("test error");
    
    expect(consoleLogs).toHaveLength(2);
    expect(consoleLogs[0]).toContain("[INFO]");
    expect(consoleLogs[1]).toContain("[ERROR]");
  });
  test("handles multiple arguments", () => {
    const logger = createPlip({ devOnly: false, enableSyntaxHighlighting: false });
    
    logger.info("test", { key: "value" }, 123, true);
    
    expect(consoleLogs[0]).toContain("test");
    expect(consoleLogs[0]).toContain('"key": "value"');
    expect(consoleLogs[0]).toContain("123");
    expect(consoleLogs[0]).toContain("true");
  });

  test("production mode respects devOnly setting", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    
    const logger = createPlip({ devOnly: true });
    logger.info("should not show in production");
    
    expect(consoleLogs).toHaveLength(0);
    
    process.env.NODE_ENV = originalEnv;
  });
  test("default plip instance works", () => {
    // Reset NODE_ENV to ensure plip works
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    
    plip.info("default instance test");
    
    expect(consoleLogs).toHaveLength(1);
    expect(consoleLogs[0]).toContain("[INFO]");
    
    process.env.NODE_ENV = originalEnv;
  });

  test("withContext adds context to log messages", () => {
    const logger = createPlip({ devOnly: false, enableColors: false });
    
    const contextLogger = logger.withContext({ 
      service: 'auth-service', 
      version: '1.2.3' 
    });
    
    contextLogger.info("User login attempt", { userId: 123 });
    
    expect(consoleLogs).toHaveLength(1);
    expect(consoleLogs[0]).toContain("service");
    expect(consoleLogs[0]).toContain("auth-service");
    expect(consoleLogs[0]).toContain("version");
    expect(consoleLogs[0]).toContain("1.2.3");
    expect(consoleLogs[0]).toContain("userId");
    expect(consoleLogs[0]).toContain("123");
  });

  test("withContext works with multiple contexts", () => {
    const logger = createPlip({ devOnly: false, enableColors: false });
    
    const contextLogger = logger
      .withContext({ service: 'payment' })
      .withContext({ version: '2.0.0', region: 'us-east-1' });
    
    contextLogger.error("Payment failed", { amount: 99.99 });
    
    expect(consoleLogs).toHaveLength(1);
    expect(consoleLogs[0]).toContain("service");
    expect(consoleLogs[0]).toContain("payment");
    expect(consoleLogs[0]).toContain("version");
    expect(consoleLogs[0]).toContain("2.0.0");
    expect(consoleLogs[0]).toContain("region");
    expect(consoleLogs[0]).toContain("us-east-1");
    expect(consoleLogs[0]).toContain("amount");
    expect(consoleLogs[0]).toContain("99.99");
  });

  test("withContext works without additional data", () => {
    const logger = createPlip({ devOnly: false, enableColors: false });
    
    const contextLogger = logger.withContext({ 
      requestId: 'req-456' 
    });
    
    contextLogger.warn("High memory usage detected");
    
    expect(consoleLogs).toHaveLength(1);
    expect(consoleLogs[0]).toContain("requestId");
    expect(consoleLogs[0]).toContain("req-456");
    expect(consoleLogs[0]).toContain("High memory usage detected");
  });

  test("withContext chains with other configuration methods", () => {
    const logger = createPlip({ devOnly: false })
      .withColors(false)
      .withContext({ module: 'test-module' });
    
    logger.success("Test completed", { duration: 150 });
    
    expect(consoleLogs).toHaveLength(1);
    expect(consoleLogs[0]).toContain("module");
    expect(consoleLogs[0]).toContain("test-module");
    expect(consoleLogs[0]).toContain("duration");
    expect(consoleLogs[0]).toContain("150");
    expect(consoleLogs[0]).toContain("Test completed");
  });

  test("context is preserved across configure calls", () => {
    const logger = createPlip({ devOnly: false, enableColors: false });
    
    const contextLogger = logger
      .withContext({ service: 'api' })
      .configure({ enableSyntaxHighlighting: false });
    
    contextLogger.info("API request processed", { endpoint: '/users' });
    
    expect(consoleLogs).toHaveLength(1);
    expect(consoleLogs[0]).toContain("service");
    expect(consoleLogs[0]).toContain("api");
    expect(consoleLogs[0]).toContain("endpoint");
    expect(consoleLogs[0]).toContain("/users");
  });
});