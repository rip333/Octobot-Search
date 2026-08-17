/**
 * The single place Cerebro query-language values are escaped and serialized.
 *
 * Nothing outside this module may interpolate a route parameter or a user's
 * search text into a Cerebro `input=` expression.
 */

const CEREBRO_FIELD_CODES = {
  id: 'id',
  name: 'n',
  subname: 'sn',
  rules: 'ru',
  trait: 'tr',
  setId: 'si',
  packId: 'pi',
  classification: 'cl',
  cardType: 'type',
  official: 'o',
} as const;

export type CerebroField = keyof typeof CEREBRO_FIELD_CODES;

export type CerebroExpression =
  | { kind: 'predicate'; field: CerebroField; value: string }
  | { kind: 'all'; operands: CerebroExpression[] }
  | { kind: 'any'; operands: CerebroExpression[] };

export const predicate = (field: CerebroField, value: string): CerebroExpression => ({
  kind: 'predicate',
  field,
  value,
});

export const all = (...operands: CerebroExpression[]): CerebroExpression => ({ kind: 'all', operands });
export const any = (...operands: CerebroExpression[]): CerebroExpression => ({ kind: 'any', operands });

/** Search is intentionally limited to official Cerebro cards. */
export const OFFICIAL_ONLY = predicate('official', 'true');

const CONTROL_CHARACTERS = new RegExp('[\u0000-\u001F\u007F]', 'g');

/**
 * Escapes a raw value for the quoted-string form Cerebro expects. Control
 * characters are dropped rather than escaped because Cerebro has no encoding
 * for them and they only ever arrive from malformed input.
 */
const escapeValue = (value: string): string =>
  value
    .replace(CONTROL_CHARACTERS, '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');

const renderExpression = (expression: CerebroExpression): string => {
  if (expression.kind === 'predicate') {
    return `${CEREBRO_FIELD_CODES[expression.field]}:"${escapeValue(expression.value)}"`;
  }

  const rendered = expression.operands
    .map(renderExpression)
    .filter(part => part.length > 0);

  if (rendered.length === 0) return '';
  if (rendered.length === 1) return rendered[0];

  const separator = expression.kind === 'all' ? '&' : '|';
  return `(${rendered.join(separator)})`;
};

/** Serializes an expression into the encoded `input=...` query string. */
export const serializeCerebroQuery = (expression: CerebroExpression): string => {
  const parameters = new URLSearchParams();
  parameters.set('input', renderExpression(expression));
  return parameters.toString();
};

/** `input=(<field>:"<value>"&o:"<official>")` — the shape every browse route uses. */
export const officialFieldQuery = (
  field: CerebroField,
  value: string,
  official: boolean,
): string =>
  serializeCerebroQuery(all(predicate(field, value), predicate('official', official ? 'true' : 'false')));
