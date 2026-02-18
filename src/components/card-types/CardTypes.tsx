import React from 'react';
import styles from "./CardTypes.module.css";
import sharedStyles from "../../styles/Shared.module.css";
import Link from 'next/link';

const card_types = [
    "ally", "alter-ego", "attachment", "environment", "event", "hero", "main scheme", "minion", "obligation", "resource", "side scheme", "support", "treachery", "upgrade", "villain"
]

const capitalize = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
};

const CardTypes: React.FC = () => {
    return (
        <div className={sharedStyles.sectionContainer}>
            <h3>Types</h3>
            <div className={sharedStyles.buttonGrid}>
                {card_types.map(ct => (
                    <Link href={`/cards/type/${ct}`} key={ct} passHref className={sharedStyles.redButton} style={{ borderStyle: 'solid' }}>
                        {capitalize(ct)}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default CardTypes;