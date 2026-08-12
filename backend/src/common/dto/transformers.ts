import { Transform } from 'class-transformer';

const FALSEY = new Set(['false', '0', 'no', 'off', '']);

/**
 * Parses a boolean out of a query string.
 *
 * Reads the *raw* value off `obj[key]` rather than the `value` handed to the
 * transform. The app's ValidationPipe runs with `enableImplicitConversion`, so
 * by the time a custom transform sees a `boolean`-typed property the string
 * "false" has already been coerced — to `true`, since a non-empty string is
 * truthy. Trusting `value` there would silently invert every opt-out flag
 * (`?withCounts=false`, `?isPlaceholder=false`), which is precisely what this
 * helper exists to prevent.
 *
 * An absent value stays `undefined` ("no opinion") rather than collapsing to
 * false, so a DTO default still applies.
 */
export const ToBoolean = () =>
  Transform(({ obj, key }) => {
    const raw: unknown = (obj as Record<string, unknown> | undefined)?.[key];
    if (raw === undefined || raw === null) return undefined;
    if (typeof raw === 'boolean') return raw;
    return !FALSEY.has(String(raw).trim().toLowerCase());
  });
