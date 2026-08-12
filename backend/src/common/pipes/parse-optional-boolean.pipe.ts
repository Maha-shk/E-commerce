import { Injectable, PipeTransform } from '@nestjs/common';

const FALSEY = new Set(['false', '0', 'no', 'off', '']);

/**
 * Reads a boolean flag from a query parameter, defaulting to false when absent.
 *
 * Exists because `Boolean("false")` is `true`: a caller passing `?cascade=false`
 * to opt *out* would otherwise trigger the very cascade they were avoiding.
 */
@Injectable()
export class ParseOptionalBooleanPipe implements PipeTransform<unknown, boolean> {
  transform(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    return !FALSEY.has(String(value).trim().toLowerCase());
  }
}
