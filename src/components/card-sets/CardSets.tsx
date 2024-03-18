import React from 'react';
import styles from "./CardSets.module.css";
import Link from 'next/link'; // Import Link from next/link
import { CardSet } from "../../models/CardSet";

interface CardSetsProps {
    cardSets: Array<CardSet>
}

const CardSets: React.FC<CardSetsProps> = ({ cardSets }) => {
    // Sort card sets by type, hero sets display first
    let heroSets: CardSet[] = [];
    let otherSets: CardSet[] = [];

    cardSets.forEach(set => {
        if (set.Type.includes("Hero")) {
            heroSets.push(set);
        } else {
            otherSets.push(set);
        }
    });

    let sortedSets = [...heroSets, ...otherSets];

    let uniqueTypes: string[] = [];
    sortedSets.forEach(set => {
        if (!uniqueTypes.includes(set.Type)) {
            uniqueTypes.push(set.Type);
        }
    });

    // Define the custom order
    const typeOrder = ["Hero Set", "Villain Set", "Modular Set", "Nemesis Set", "Campaign Set", "Supplementary Set"];

    // Sort uniqueTypes based on the predefined order
    uniqueTypes.sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b));

    cardSets.sort((a, b) => a.Name.localeCompare(b.Name));

    return (
        <div className={styles.cardSets}>
            {uniqueTypes.map(type => (
                <div key={type}>
                    <h3>{type}</h3>
                    {cardSets.filter(set => set.Type === type).map(filteredSet => (
                        <Link href={`/cards/si/${filteredSet.Id}`} key={filteredSet.Id} passHref className={styles.setButton} role="button">
                            {filteredSet.Name}
                        </Link>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default CardSets;
