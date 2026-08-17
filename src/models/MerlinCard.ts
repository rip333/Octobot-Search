/**
 * The subset of a Merlin card the adapter consumes.
 *
 * Merlin omits stat keys entirely when a card has no such stat (an alter-ego
 * has no `cost`, `attack`, or `thwart` key at all), so every stat is optional
 * as well as nullable.
 */
export interface MerlinCard {
    code: string;
    name: string;
    real_name?: string;
    type_name: string;
    faction_name: string;
    real_traits?: string;
    real_text?: string;
    text?: string;
    cost?: number | null;
    health?: number | null;
    attack?: number | null;
    thwart?: number | null;
    is_unique?: boolean;
    status: string;
    creator?: string;
    imagesrc?: string | null;
    backimagesrc?: string | null;
    double_sided?: boolean;
    pack_code: string;
    position?: number | null;
    card_set_code?: string;
    flavor?: string | null;
}
