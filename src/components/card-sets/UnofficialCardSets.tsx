import React from 'react';
import styles from "./CardSets.module.css";
import sharedStyles from "../../styles/Shared.module.css";
import Link from 'next/link';
import { UnofficialCardSet } from "../../models/CardSet";
import { compareCardSets } from '@/utils/cardCollections';

interface UnofficialCardSetsProps {
    /** Already resolved to a browse route by `/api/browse/unofficial`. */
    sets: UnofficialCardSet[];
}

const UnofficialCardSets: React.FC<UnofficialCardSetsProps> = ({ sets }) => {
    const sortedSets = [...sets].sort(compareCardSets);
    const types = Array.from(new Set(sortedSets.map(set => set.Type)));

    return (
        <div className={sharedStyles.sectionContainer}>
            {/*
              Creator Drive Libraries are intentionally disabled. The public
              page and API must remain unavailable until the authorization,
              validation, pagination, caching, and rate-limit work documented
              in pages/creators/[id].tsx is complete.
            */}
            {types.map(type => (
                <section key={type} className={styles.typeSection}>
                    <h3>{type}</h3>
                    <ul className={sharedStyles.buttonGrid}>
                        {sortedSets.filter(set => set.Type === type).map(set => (
                            <li key={`${set.Source}-${set.Id}`}>
                                <Link
                                    href={`/cards/${set.Source}/${set.Id}`}
                                    className={sharedStyles.redButton}
                                >
                                    {set.Name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
};

export default UnofficialCardSets;
