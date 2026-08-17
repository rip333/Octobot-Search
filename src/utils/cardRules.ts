export type CardRulesToken =
  | { type: 'text'; value: string }
  | { type: 'icon'; value: string };

/**
 * Splits card rules into plain text and explicit single-character icon tokens.
 * Multi-character or malformed brace sequences remain untouched as text.
 */
export function tokenizeCardRules(text: string): CardRulesToken[] {
  const tokens: CardRulesToken[] = [];
  const iconToken = /\{([^{}])\}/gu;
  let textStart = 0;
  let match: RegExpExecArray | null;

  while ((match = iconToken.exec(text)) !== null) {
    const matchStart = match.index;

    if (matchStart > textStart) {
      tokens.push({ type: 'text', value: text.slice(textStart, matchStart) });
    }

    tokens.push({ type: 'icon', value: match[1] });
    textStart = matchStart + match[0].length;
  }

  if (textStart < text.length) {
    tokens.push({ type: 'text', value: text.slice(textStart) });
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', value: text }];
}
