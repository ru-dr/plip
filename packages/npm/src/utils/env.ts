/**
 * Reads an environment variable without assuming `process` exists.
 * Browser bundles without a process shim would otherwise throw on import.
 */
function getEnv(name: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  return process.env[name];
}

/**
 * Detects if we're running in a development environment
 */
export function isDevelopment(): boolean {
  return getEnv("NODE_ENV") !== "production";
}

/**
 * Detects if we're running in a production environment
 */
export function isProduction(): boolean {
  return getEnv("NODE_ENV") === "production";
}

/**
 * Detects if we're running in a Node.js environment
 */
export function isNode(): boolean {
  return typeof process !== "undefined" &&
         process.versions !== undefined &&
         typeof process.versions.node === "string";
}

/**
 * Detects if we're running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof globalThis !== "undefined" &&
         "window" in globalThis &&
         "document" in globalThis;
}

/**
 * Detects if we're running in Deno
 */
export function isDeno(): boolean {
  return typeof (globalThis as { Deno?: unknown }).Deno !== "undefined";
}

/**
 * Gets the current runtime environment
 */
export function getRuntimeEnvironment(): "node" | "browser" | "deno" | "unknown" {
  // Deno ships a `process` shim, so it must be checked before Node.
  if (isDeno()) return "deno";
  if (isNode()) return "node";
  if (isBrowser()) return "browser";
  return "unknown";
}

/**
 * Checks if the current terminal/environment supports colors
 */
export function supportsColor(): boolean {
  // In browser, always return false for now
  if (isBrowser()) return false;

  // In Node.js, check various environment variables
  if (isNode()) {
    // Check if NO_COLOR is set (universal way to disable colors)
    if (getEnv("NO_COLOR")) return false;

    // Check if FORCE_COLOR is set
    if (getEnv("FORCE_COLOR")) return true;

    // Check if we're in a TTY
    if (process.stdout && typeof process.stdout.isTTY === "boolean") {
      return process.stdout.isTTY;
    }

    // Check common terminal environment variables
    const term = getEnv("TERM");
    if (term === "dumb") return false;
    if (term && (term.includes("color") || term.includes("256"))) return true;

    // Check for common CI environments that support colors
    const ci = getEnv("CI");
    if (ci && (
      getEnv("GITHUB_ACTIONS") ||
      getEnv("GITLAB_CI") ||
      getEnv("CIRCLECI") ||
      getEnv("TRAVIS")
    )) {
      return true;
    }
  }

  // Default to true for Deno and unknown environments
  return true;
}

