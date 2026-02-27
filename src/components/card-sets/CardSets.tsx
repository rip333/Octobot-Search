import React from 'react';
import sharedStyles from "../../styles/Shared.module.css";
import Link from 'next/link'; // Import Link from next/link
import { CardSet } from "../../models/CardSet";

interface CardSetsProps {
    cardSets: Array<CardSet>;
    baseLink?: string;
}

const CardSets: React.FC<CardSetsProps> = ({ cardSets, baseLink = "/cards/si/" }) => {
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
        <div className={sharedStyles.sectionContainer}>
            {uniqueTypes.map(type => (
                <div key={type}>
                    <h3>{type}</h3>
                    <div className={sharedStyles.buttonGrid}>
                        {cardSets.filter(set => set.Type === type).map(filteredSet => (
                            <Link href={`${baseLink}${filteredSet.Id}`} key={filteredSet.Id} passHref className={sharedStyles.redButton} role="button">
                                {filteredSet.Name}
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CardSets;
