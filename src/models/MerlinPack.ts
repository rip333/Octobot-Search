/** The subset of a Merlin pack the browse UI actually consumes. */
export interface MerlinPack {
    code: string;
    name: string;
    status: string;
    pack_type: string;
    pack_type_name?: string;
}
