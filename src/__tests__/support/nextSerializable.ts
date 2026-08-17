/**
 * Mirrors the serialization rule Next enforces on `getStaticProps` props.
 *
 * Next walks the props tree and throws on `undefined` — including an optional
 * field that was set to `undefined` rather than omitted. That failure only
 * appears at request time on a page whose upstream happened to return a sparse
 * record, so it is exactly the kind of thing that has to be asserted in tests.
 */

const PATH_ROOT = 'props';

const describeValue = (value: unknown): string => {
  if (value === undefined) return '`undefined`';
  if (typeof value === 'function') return 'a function';
  if (typeof value === 'symbol') return 'a symbol';
  if (typeof value === 'bigint') return 'a bigint';
  if (value instanceof Date) return 'a Date';
  return `a ${Object.prototype.toString.call(value)}`;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const collectViolations = (value: unknown, path: string, violations: string[]): void => {
  if (value === null) return;

  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
      return;
    case 'undefined':
    case 'function':
    case 'symbol':
    case 'bigint':
      violations.push(`${path} is ${describeValue(value)}`);
      return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectViolations(entry, `${path}[${index}]`, violations));
    return;
  }

  if (!isPlainObject(value)) {
    violations.push(`${path} is ${describeValue(value)}`);
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    collectViolations(entry, `${path}.${key}`, violations);
  }
};

/** Returns every path Next would reject, so a failure names the offending field. */
export const findUnserializableValues = (value: unknown, rootPath = PATH_ROOT): string[] => {
  const violations: string[] = [];
  collectViolations(value, rootPath, violations);
  return violations;
};
