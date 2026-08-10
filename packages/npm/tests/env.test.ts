// tests/env.test.ts
import { test, expect, describe } from "bun:test";
import { isNode, isBrowser, isDeno, getRuntimeEnvironment, isDevelopment, isProduction, supportsColor } from "../src/utils/env.js";

describe("Environment Detection", () => {
  test("isNode should return true in Node.js environment", () => {
    expect(isNode()).toBe(true);
  });

  test("isBrowser should return false in Node.js environment", () => {
    expect(isBrowser()).toBe(false);
  });

  test("isDeno should return false in Node.js environment", () => {
    expect(isDeno()).toBe(false);
  });

  test("getRuntimeEnvironment should return 'node'", () => {
    expect(getRuntimeEnvironment()).toBe("node");
  });

  test("isDevelopment and isProduction should work correctly", () => {
    const originalEnv = process.env.NODE_ENV;
    
    // Test development
    process.env.NODE_ENV = "development";
    expect(isDevelopment()).toBe(true);
    expect(isProduction()).toBe(false);
    
    // Test production
    process.env.NODE_ENV = "production";
    expect(isDevelopment()).toBe(false);
    expect(isProduction()).toBe(true);
    
    // Test undefined (should default to development)
    delete process.env.NODE_ENV;
    expect(isDevelopment()).toBe(true);
    expect(isProduction()).toBe(false);
    
    // Restore original
    process.env.NODE_ENV = originalEnv;
  });

  test("supportsColor should be a boolean", () => {
    expect(typeof supportsColor()).toBe("boolean");
  });

});
