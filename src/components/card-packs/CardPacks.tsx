import React from 'react';
import Link from 'next/link'; // Import Link from next/link
import sharedStyles from "../../styles/Shared.module.css";
import { CardPack } from '@/models/CardPack';

interface CardPacksProps {
    cardPacks: Array<CardPack>;
}

const CardPacks: React.FC<CardPacksProps> = ({ cardPacks }) => {
    // Sorting cardPacks by the number property
    const sortedCardPacks = cardPacks.sort((a, b) => {
        const numA = parseInt(a.Number, 10);
        const numB = parseInt(b.Number, 10);

        // Handling cases where Number is 0
        if (numA === 0) return 1; // Moves A to the end if its Number is 0
        if (numB === 0) return -1; // Moves B to the end if its Number is 0

        // Standard numeric sort for other cases
        return numA - numB;
    });

    return (
        <div className={sharedStyles.sectionContainer}>
            <h3>Packs</h3>
            {sortedCardPacks.map(pack => (
                <Link href={`/cards/pi/${pack.Id}`} key={pack.Id} passHref className={sharedStyles.redButton}>
                    {pack.Name}
                </Link>
            ))}
        </div>
    );
};

export default CardPacks;
