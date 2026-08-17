import React from 'react';
import sharedStyles from "../../styles/Shared.module.css";
import Link from 'next/link';
import { CardSet } from "../../models/CardSet";
import { compareCardSets } from '@/utils/cardCollections';

interface CardSetsProps {
    cardSets: Array<CardSet>
}

const CardSets: React.FC<CardSetsProps> = ({ cardSets }) => {
    const sortedCardSets = [...cardSets].sort(compareCardSets);
    const uniqueTypes = Array.from(new Set(sortedCardSets.map(set => set.Type)));

    return (
        <div className={sharedStyles.sectionContainer}>
            {uniqueTypes.map(type => (
                <section key={type}>
                    <h3>{type}</h3>
                    <ul className={sharedStyles.buttonGrid}>
                        {sortedCardSets.filter(set => set.Type === type).map(filteredSet => (
                            <li key={filteredSet.Id}>
                                <Link href={`/cards/si/${filteredSet.Id}`} className={sharedStyles.redButton}>
                                    {filteredSet.Name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
};

export default CardSets;
