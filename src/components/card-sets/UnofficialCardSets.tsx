import React from 'react';
import styles from "./CardSets.module.css";
import sharedStyles from "../../styles/Shared.module.css";
import Link from 'next/link';
import { CardSet } from "../../models/CardSet";
import { MerlinPack } from "../../models/MerlinPack";

import { merlinPackToCardSet } from '@/merlin-adapter';

interface UnofficialCardSetsProps {
    unofficialCerebroSets: CardSet[];
    merlinPacks: MerlinPack[];
}

const UnofficialCardSets: React.FC<UnofficialCardSetsProps> = ({ unofficialCerebroSets, merlinPacks }) => {
    // Convert Merlin packs to CardSets and mark their source
    const adaptedMerlinSets = merlinPacks.map(pack => ({
        ...merlinPackToCardSet(pack),
        Source: 'ms' as const
    }));

    const adaptedCerebroSets = unofficialCerebroSets.map(set => ({
        ...set,
        Source: 'usi' as const
    }));

    // Combine and sort
    const allCustomSets = [...adaptedMerlinSets, ...adaptedCerebroSets].sort((a, b) => {
        if (a.Type !== b.Type) return a.Type.localeCompare(b.Type);
        return a.Name.localeCompare(b.Name);
    });

    // Group by type
    const types = Array.from(new Set(allCustomSets.map(s => s.Type)));
    const typeOrder = ["Hero Set", "Villain Set", "Modular Set", "Nemesis Set", "Campaign Set", "Supplementary Set", "Core"];

    types.sort((a, b) => {
        const indexA = typeOrder.indexOf(a);
        const indexB = typeOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    return (
        <div className={sharedStyles.sectionContainer}>
            {types.map(type => (
                <div key={type} className={styles.typeSection}>
                    <h3>{type}</h3>
                    <div className={sharedStyles.buttonGrid}>
                        {allCustomSets.filter(set => set.Type === type).map(set => (
                            <Link
                                href={`/cards/${set.Source}/${set.Id}`}
                                key={`${set.Source}-${set.Id}`}
                                className={sharedStyles.redButton}
                                role="button"
                            >
                                {set.Name}
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UnofficialCardSets;
