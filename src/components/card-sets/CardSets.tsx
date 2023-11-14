import React from 'react';
import styles from "./CardSets.module.css";
import { useRouter } from 'next/router'; // Import useRouter
import { CardSet } from "../../models/CardSet";

interface CardSetsProps {
    cardSets: Array<CardSet>
}

const CardSets: React.FC<CardSetsProps> = ({ cardSets }) => {
    const router = useRouter(); // Initialize useRouter

    //sort card sets by type, hero sets display first
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


    const handleClick = (Id: string) => {
        router.push(`/cards/si/${Id}`);
    };

    cardSets.sort((a, b) => a.Name.localeCompare(b.Name));

    return (
        <div className={styles.cardSets}>
            {uniqueTypes.map(type => (
                <div key={type}>
                    <h3>{type}</h3>
                    {cardSets.filter(set => set.Type === type).map(filteredSet => (
                        <button
                            className={styles.setButton}
                            key={filteredSet.Id}
                            onClick={() => handleClick(filteredSet.Id)}
                        >
                            {filteredSet.Name}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default CardSets;
