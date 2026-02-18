import React from 'react';
import styles from "./CardSets.module.css";
import sharedStyles from "../../styles/Shared.module.css";
import Link from 'next/link';
import { CardSet } from "../../models/CardSet";
import { MerlinPack } from "../../models/MerlinPack";

interface UnofficialCardSetsProps {
    unofficialCerebroSets: CardSet[];
    merlinPacks: MerlinPack[];
}

const UnofficialCardSets: React.FC<UnofficialCardSetsProps> = ({ unofficialCerebroSets, merlinPacks }) => {
    // Sort Merlin packs by position/name
    const sortedMerlinPacks = [...merlinPacks].sort((a, b) => a.name.localeCompare(b.name));

    // Sort Cerebro sets by type, then name
    const sortedCerebroSets = [...unofficialCerebroSets].sort((a, b) => {
        if (a.Type !== b.Type) return a.Type.localeCompare(b.Type);
        return a.Name.localeCompare(b.Name);
    });

    // Group Cerebro sets by type
    const cerebroTypes = Array.from(new Set(sortedCerebroSets.map(s => s.Type)));
    const typeOrder = ["Hero Set", "Villain Set", "Modular Set", "Nemesis Set", "Campaign Set", "Supplementary Set"];
    cerebroTypes.sort((a, b) => {
        const indexA = typeOrder.indexOf(a);
        const indexB = typeOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    return (
        <div className={sharedStyles.sectionContainer}>
            <div className={styles.categorySection}>
                <h2>Merlin Custom Content</h2>
                <div className={sharedStyles.buttonGrid}>
                    {sortedMerlinPacks.map(pack => (
                        <Link href={`/cards/ms/${pack.code}`} key={pack.code} className={sharedStyles.redButton} role="button">
                            {pack.name}
                        </Link>
                    ))}
                </div>
            </div>

            <div className={styles.categorySection}>
                <h2>Unofficial Cerebro Content</h2>
                {cerebroTypes.map(type => (
                    <div key={type} className={styles.typeSection}>
                        <h3>{type}</h3>
                        <div className={sharedStyles.buttonGrid}>
                            {sortedCerebroSets.filter(set => set.Type === type).map(set => (
                                <Link href={`/cards/usi/${set.Id}`} key={set.Id} className={sharedStyles.redButton} role="button">
                                    {set.Name}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UnofficialCardSets;
