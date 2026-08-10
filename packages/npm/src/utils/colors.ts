import type { ColorFn } from '../types/config.js';

const ESC = '\x1b[';

/**
 * Wraps text in an SGR pair. Any reset of the same kind already inside `text`
 * is re-opened, so nesting two styles cannot truncate the outer one.
 */
function sgr(open: number, close: number): ColorFn {
  const openSeq = `${ESC}${open}m`;
  const closeSeq = `${ESC}${close}m`;

  return (text: string) => {
    const body = text.includes(closeSeq)
      ? text.split(closeSeq).join(closeSeq + openSeq)
      : text;
    return `${openSeq}${body}${closeSeq}`;
  };
}

const FG_CLOSE = 39;

const blackFg = sgr(30, FG_CLOSE);
const redFg = sgr(31, FG_CLOSE);
const greenFg = sgr(32, FG_CLOSE);
const yellowFg = sgr(33, FG_CLOSE);
const blueFg = sgr(34, FG_CLOSE);
const magentaFg = sgr(35, FG_CLOSE);
const cyanFg = sgr(36, FG_CLOSE);
const blackBrightFg = sgr(90, FG_CLOSE);
const blueBrightFg = sgr(94, FG_CLOSE);

const compose = (outer: ColorFn, inner: ColorFn): ColorFn => text => outer(inner(text));

/** Per-level colors, plus the general-purpose styles re-exported by the package. */
export const colors = {
  info: cyanFg,
  infoDim: compose(cyanFg, blackBrightFg),
  warn: yellowFg,
  warnDim: compose(yellowFg, blackBrightFg),
  error: redFg,
  errorDim: compose(redFg, blackBrightFg),
  success: greenFg,
  successDim: compose(greenFg, blackBrightFg),
  debug: magentaFg,
  debugDim: compose(magentaFg, blackBrightFg),
  trace: blueFg,
  traceDim: compose(blueFg, blackBrightFg),
  verbose: blackBrightFg,
  verboseDim: blackFg,

  bold: sgr(1, 22),
  dim: blackBrightFg,
  italic: sgr(3, 23),
  underline: sgr(4, 24),

  red: redFg,
  green: greenFg,
  yellow: yellowFg,
  blue: blueFg,
  magenta: magentaFg,
  cyan: cyanFg,
  gray: blackBrightFg,
  brightBlue: blueBrightFg,
} as const;

/** Applies `colorFn` to `text`, or returns it untouched when disabled. */
export function colorize(text: string, colorFn: ColorFn, enabled: boolean = true): string {
  if (!enabled) return text;
  return typeof colorFn === 'function' ? colorFn(text) : text;
}

/** Removes ANSI SGR escape sequences from `text`. */
export function stripColors(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

function createColorFunction(colorFn: ColorFn) {
  return (text: string, enabled: boolean = true) => colorize(text, colorFn, enabled);
}

export const red = /*#__PURE__*/ createColorFunction(redFg);
export const green = /*#__PURE__*/ createColorFunction(greenFg);
export const yellow = /*#__PURE__*/ createColorFunction(yellowFg);
export const blue = /*#__PURE__*/ createColorFunction(blueFg);
export const magenta = /*#__PURE__*/ createColorFunction(magentaFg);
export const cyan = /*#__PURE__*/ createColorFunction(cyanFg);
export const gray = /*#__PURE__*/ createColorFunction(blackBrightFg);
export const brightBlue = /*#__PURE__*/ createColorFunction(blueBrightFg);

/** Reports whether `text` contains ANSI escape sequences. */
export function hasColors(text: string): boolean {
  return text !== stripColors(text);
}

/** Highlights `code` when it is JSON; other languages are returned unchanged. */
export function highlightCode(code: string, language?: string): string {
  try {
    if (language === 'json' || code.trim().startsWith('{') || code.trim().startsWith('[')) {
      return highlightJson(code);
    }

    return code;
  } catch {
    return code;
  }
}

// Matches whole JSON tokens (strings, numbers, literals) so that values which
// themselves contain quotes or colons cannot be mis-highlighted.
const JSON_TOKEN =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

function highlightJson(jsonString: string): string {
  return jsonString.replace(JSON_TOKEN, (match, _token, colon) => {
    if (colon !== undefined) return blueFg(match);
    if (match.startsWith('"')) return greenFg(match);
    if (match === 'true' || match === 'false') return magentaFg(match);
    if (match === 'null') return redFg(match);
    return yellowFg(match);
  });
}

/** Serializes `obj` as pretty JSON, optionally syntax-highlighted. */
export function formatObject(obj: any, enableColors: boolean = true): string {
  if (typeof obj === 'string') return obj;

  const jsonString = JSON.stringify(obj, null, 2);

  if (!enableColors) return jsonString;

  return highlightCode(jsonString, 'json');
}
