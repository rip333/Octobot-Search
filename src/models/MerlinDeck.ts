export interface MerlinDeck {
    id: number;
    name: string;
    date_creation: string;
    date_update: string;
    description_md: string;
    user_id: number;
    hero_code: string;
    hero_name: string;
    slots: { [cardCode: string]: number };
    ignoreDeckLimit: boolean;
    version: number;
    meta: string; // JSON string
    tags: string;
}

export interface MerlinDecklist {
    id: number;
    name: string;
    date_creation: string;
    date_update: string;
    description_md: string;
    user_id: number;
    hero_code: string;
    hero_name: string;
    slots: { [cardCode: string]: number };
    starting_threat: number;
    version: string;
    meta: string; // JSON string
    tags: string;
    like_count: number;
    favorite_count: number;
    comment_count: number;
}
