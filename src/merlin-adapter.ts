import { MERLIN_ORIGIN } from "./api/merlin";
import { withoutUndefined } from "./api/parse";
import { Card } from "./models/Card";
import { CardSet } from "./models/CardSet";
import { MerlinCard } from "./models/MerlinCard";
import { MerlinPack } from "./models/MerlinPack";

/**
 * Every `pack_type` Merlin currently serves, mapped onto the shared set-type
 * vocabulary in `@/utils/cardCollections`. Unlisted values fall back to
 * Merlin's own display name so a new upstream type still reads sensibly.
 */
const MERLIN_PACK_TYPE_TO_SET_TYPE: Record<string, string> = {
    core: "Supplementary Set",
    encounter: "Modular Set",
    fm_story: "Campaign Set",
    fm_theme: "Modular Set",
    hero: "Hero Set",
    hero_fanmade: "Hero Set",
    scenar_fanmade: "Villain Set",
    scenario: "Villain Set",
    story: "Campaign Set",
};

/** Merlin marks published content with `status: "Official"`; everything else is community content. */
const isOfficialStatus = (status: string): boolean => status === "Official";

const statValue = (value: number | null | undefined): string | undefined =>
    typeof value === "number" ? value.toString() : undefined;

/** Merlin serves image paths relative to its own origin. */
const absoluteImageUrl = (imagePath: string | null | undefined): string =>
    imagePath ? `${MERLIN_ORIGIN}${imagePath}` : "";

export const merlinCardToCard = (merlinCard: MerlinCard): Card => {
    // Process traits: "Hero. Genius." -> ["Hero", "Genius"]
    const traits = merlinCard.real_traits
        ? merlinCard.real_traits.split(".")
            .map(t => t.trim())
            .filter(t => t.length > 0)
        : [];

    // Merlin numbers cards within their pack; there is no separate set number.
    const position = statValue(merlinCard.position) ?? "";
    const backImageUrl = merlinCard.double_sided ? absoluteImageUrl(merlinCard.backimagesrc) : "";

    return withoutUndefined({
        Id: merlinCard.code,
        Name: merlinCard.name,
        Subname: merlinCard.real_name ?? "",
        Type: merlinCard.type_name,
        Classification: merlinCard.faction_name,
        Traits: traits,
        Rules: merlinCard.real_text || merlinCard.text || "",
        Cost: statValue(merlinCard.cost) ?? "",
        Health: statValue(merlinCard.health),
        Attack: statValue(merlinCard.attack),
        Thwart: statValue(merlinCard.thwart),
        // Merlin does not model resource icons.
        Resource: undefined,
        Unique: merlinCard.is_unique === true,
        Official: isOfficialStatus(merlinCard.status),
        AuthorId: merlinCard.creator,
        Deleted: false,
        ImageUrl: absoluteImageUrl(merlinCard.imagesrc),
        BackImageUrl: backImageUrl || undefined,
        Printings: [withoutUndefined({
            ArtificialId: merlinCard.code,
            PackId: merlinCard.pack_code,
            PackNumber: position,
            SetId: merlinCard.card_set_code ?? "",
            SetNumber: position,
            UniqueArt: true,
            Flavor: merlinCard.flavor ?? undefined,
        })]
    });
};

export const merlinPackToCardSet = (merlinPack: MerlinPack): CardSet => ({
    Id: merlinPack.code,
    Name: merlinPack.name,
    Type: MERLIN_PACK_TYPE_TO_SET_TYPE[merlinPack.pack_type]
        ?? merlinPack.pack_type_name
        ?? "Merlin Custom Set",
});
