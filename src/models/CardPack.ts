/** The subset of a Cerebro pack the browse UI actually consumes. */
export interface CardPack {
    Id: string;
    Name: string;
    /** Release ordering as reported by Cerebro; may be absent or `"0"`. */
    Number: string;
}
