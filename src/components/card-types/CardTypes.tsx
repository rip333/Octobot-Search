import React from 'react';
import styles from "./CardTypes.module.css";
import Link from 'next/link';

const card_types = [
    "ally", "alter-ego", "attachment", "environment", "event", "hero", "main scheme", "minion", "obligation", "resource", "side scheme", "support", "treachery", "upgrade", "villain"
]

const capitalize = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

const CardTypes: React.FC = () => {
    return (
        <div className={styles.cardTypes}>
            <h3>Types</h3>
            {card_types.map(ct => (
                <Link href={`/cards/type/${ct}`} key={ct} passHref className={styles.cardTypesButton}>
                    {capitalize(ct)}
                </Link>
            ))}
        </div>
    );
};

export default CardTypes;