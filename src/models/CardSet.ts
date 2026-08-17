/**
 * The subset of a Cerebro set the browse UI actually consumes.
 *
 * Deliberately narrow: this shape is serialized into page data, so unused
 * upstream fields would be paid for on every homepage request.
 */
export interface CardSet {
    Id: string;
    Name: string;
    Type: string;
}

/** Which browse route a community set is reachable through. */
export type CardSetSource = 'ms' | 'usi';

/** A community set already resolved to its browse route, ready to render. */
export interface UnofficialCardSet extends CardSet {
    Source: CardSetSource;
}
