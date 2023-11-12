import React from 'react';
import styles from "./CardSets.module.css";
import { useRouter } from 'next/router'; // Import useRouter
import { CardSet } from "../../models/CardSet";

interface CardSetsProps {
    cardSets: Array<CardSet>
}

const CardSets: React.FC<CardSetsProps> = ({ cardSets }) => {
    const router = useRouter(); // Initialize useRouter

    const handleClick = (Id: string) => {
        router.push(`/set?setId=${Id}`);
    };

    return (
        <div className={styles.cardSets}>
            {cardSets.map(set => (
                <button className={styles.setButton} key={set.Id} onClick={() => handleClick(set.Id)}>
                    {set.Name}
                </button>
            ))}
        </div>
    );
};

export default CardSets;
