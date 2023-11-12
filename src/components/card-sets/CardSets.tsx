import React from 'react';
import styles from "./CardSets.module.css";
import { useRouter } from 'next/router'; // Import useRouter
import { CardSet } from "../../models/CardSet";

interface CardSetsProps {
    cardSets: Array<CardSet>
}

const CardSets: React.FC<CardSetsProps> = ({ cardSets }) => {
    const router = useRouter(); // Initialize useRouter
    let uniqueTypes: string[] = [];
    cardSets.forEach(set => {
        !uniqueTypes.includes(set.Type) && uniqueTypes.push(set.Type);
    });

    const handleClick = (Id: string) => {
        router.push(`/si/${Id}`);
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
