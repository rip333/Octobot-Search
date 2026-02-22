import { Card } from "./models/Card";
import { CardPack } from "./models/CardPack";
import { CardSet } from "./models/CardSet";
import { MerlinCard } from "./models/MerlinCard";
import { MerlinPack } from "./models/MerlinPack";

const MERLIN_IMAGE_BASE_URL = "https://db.merlindumesnil.net";

export const merlinCardToCard = (merlinCard: MerlinCard): Card => {
    // Process traits: "Hero. Genius." -> ["Hero", "Genius"]
    const traits = merlinCard.real_traits
        ? merlinCard.real_traits.split(".")
            .map(t => t.trim())
            .filter(t => t.length > 0)
        : [];

    // Map fields
    return {
        Id: merlinCard.code || "",
        Name: merlinCard.name || "",
        Subname: merlinCard.real_name || "",
        Type: merlinCard.type_name || "",
        Classification: merlinCard.faction_name || "",
        Traits: traits,
        Rules: merlinCard.real_text || merlinCard.text || "",
        Cost: (merlinCard.cost !== null && merlinCard.cost !== undefined) ? merlinCard.cost.toString() : "",
        Health: (merlinCard.health !== null && merlinCard.health !== undefined) ? merlinCard.health.toString() : null as any,
        Attack: (merlinCard.attack !== null && merlinCard.attack !== undefined) ? merlinCard.attack.toString() : null as any,
        Thwart: (merlinCard.thwart !== null && merlinCard.thwart !== undefined) ? merlinCard.thwart.toString() : null as any,
        Resource: "",
        Unique: !!merlinCard.is_unique,
        Official: merlinCard.status === "Official",
        AuthorId: merlinCard.creator || "",
        Deleted: false,
        ImageUrl: merlinCard.imagesrc ? `${MERLIN_IMAGE_BASE_URL}${merlinCard.imagesrc}` : "",
        Printings: [{
            ArtificialId: merlinCard.code || "",
            PackId: merlinCard.pack_code || "",
            PackNumber: (merlinCard.position !== undefined && merlinCard.position !== null) ? merlinCard.position.toString() : "0",
            SetId: merlinCard.card_set_code || "",
            SetNumber: (merlinCard.position !== undefined && merlinCard.position !== null) ? merlinCard.position.toString() : "0",
            UniqueArt: true,
            Flavor: merlinCard.flavor || null as any
        }]
    };
};

export const merlinPackToCardPack = (merlinPack: MerlinPack): CardPack => {
    return {
        Id: merlinPack.code,
        Name: merlinPack.name,
        Type: merlinPack.pack_type_name || "Merlin Custom", // Use pack_type_name if available
        Number: merlinPack.position.toString(),
        Incomplete: merlinPack.known < merlinPack.total,
        SpoilerTag: merlinPack.status === "spoiled"
    };
};

export const merlinCardsToCardSets = (merlinCards: MerlinCard[]): CardSet[] => {
    // Group cards by card_set_code to identify sets
    const setsMap = new Map<string, MerlinCard[]>();

    merlinCards.forEach(card => {
        if (!setsMap.has(card.card_set_code)) {
            setsMap.set(card.card_set_code, []);
        }
        setsMap.get(card.card_set_code)?.push(card);
    });

    const cardSets: CardSet[] = [];

    setsMap.forEach((cards, setCode) => {
        const firstCard = cards[0];
        cardSets.push({
            Id: setCode,
            Name: firstCard.card_set_name,
            Official: firstCard.status === "Official",
            Type: "Merlin Custom Set", // Cards don't have pack_type_name yet
            Deleted: false,
            CanSimulate: false,
            Deviation: false,
            Modulars: 0,
            PackId: firstCard.pack_code
        });
    });

    return cardSets;
};

export const merlinPackToCardSet = (merlinPack: MerlinPack): CardSet => {
    // Map merlin pack types to cerebro-like types for better grouping if needed, 
    // but user suggested pack_type_name for display.
    let type = merlinPack.pack_type_name || "Merlin Custom Set";

    // Optional: normalize to cerebro types if they match
    if (merlinPack.pack_type === "hero" || merlinPack.pack_type === "hero_fanmade") {
        type = "Hero Set";
    } else if (merlinPack.pack_type === "scenario" || merlinPack.pack_type === "scenar_fanmade") {
        type = "Villain Set";
    } else if (merlinPack.pack_type === "fm_theme") {
        type = "Modular Set";
    } else if (merlinPack.pack_type === "story") {
        type = "Campaign Set";
    }

    return {
        Id: merlinPack.code,
        Name: merlinPack.name,
        Official: merlinPack.status === "Official",
        Type: type,
        Deleted: false,
        CanSimulate: false,
        Deviation: false,
        Modulars: 0,
        PackId: merlinPack.code
    };
};
