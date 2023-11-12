import React from 'react';
import styles from "./CardPacks.module.css";
import { useRouter } from 'next/router'; // Import useRouter
import { CardPack } from '@/models/CardPack';

interface CardPacksProps {
    cardPacks: Array<CardPack>
}

const CardSets: React.FC<CardPacksProps> = ({ cardPacks }) => {
    const router = useRouter(); // Initialize useRouter

    const handleClick = (Id: string) => {
        router.push(`/pi/${Id}`);
    };

    // Sorting cardPacks by the number property
    const sortedCardPacks = cardPacks.sort((a, b) => {
        const numA = parseInt(a.Number);
        const numB = parseInt(b.Number);

        // Handling cases where Number is 0
        if (numA === 0) return 1; // Moves A to the end if its Number is 0
        if (numB === 0) return -1; // Moves B to the end if its Number is 0

        // Standard numeric sort for other cases
        return numA - numB;
    });

    return (
        <div className={styles.cardPacks}>
            <h3>Packs</h3>
            {sortedCardPacks.map(pack => (
                <button className={styles.packButton} key={pack.Id} onClick={() => handleClick(pack.Id)}>
                    {pack.Name}
                </button>
            ))}
        </div>
    );
};

export default CardSets;
