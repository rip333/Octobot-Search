import React from 'react';
import sharedStyles from "../../styles/Shared.module.css";
import Link from 'next/link'; // Import Link
import { CARD_CLASSIFICATIONS } from '@/utils/cardVocabulary';

const c12ns = CARD_CLASSIFICATIONS;

const Classifications: React.FC = () => {
    return (
        <div className={sharedStyles.sectionContainer}>
            <h3>Classifications</h3>
            <div className={sharedStyles.buttonGrid}>
                {c12ns.map(cl => (
                    <Link href={`/cards/cl/${cl.name}`} key={cl.name} passHref className={sharedStyles.redButton} style={{ borderColor: cl.color, borderStyle: 'solid' }}>
                        {cl.name}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Classifications;