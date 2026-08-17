import React from 'react';
import Link from 'next/link';
import sharedStyles from "../../styles/Shared.module.css";
import { CardPack } from '@/models/CardPack';
import { compareCardPacks } from '@/utils/cardCollections';

interface CardPacksProps {
    cardPacks: Array<CardPack>;
}

const CardPacks: React.FC<CardPacksProps> = ({ cardPacks }) => {
    const sortedCardPacks = [...cardPacks].sort(compareCardPacks);

    return (
        <section className={sharedStyles.sectionContainer}>
            <h3>Packs</h3>
            <ul className={sharedStyles.buttonGrid}>
                {sortedCardPacks.map(pack => (
                    <li key={pack.Id}>
                        <Link href={`/cards/pi/${pack.Id}`} className={sharedStyles.redButton}>
                            {pack.Name}
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default CardPacks;
