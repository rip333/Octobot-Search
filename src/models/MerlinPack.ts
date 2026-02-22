export interface MerlinPack {
    name: string;
    code: string;
    position: number;
    available: string;
    known: number;
    total: number;
    url: string;
    id: number;
    status: string;
    creator: string;
    theme: string;
    environment: string | null;
    visibility: string;
    language: string;
    pack_type: string;
    pack_type_name: string;
}
