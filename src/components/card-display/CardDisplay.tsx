import { Card } from "@/models/Card";
import CardImage from "../card-image/CardImage";
import styles from './CardDisplay.module.css'; // Import the CSS Module
import React, { useState } from "react";

interface CardProps {
    card: Card;
}

const CardDisplay: React.FC<CardProps> = ({ card }) => {

    const [activePrinting, setActivePrinting] = useState<number>(0);

    const applyCustomFontToBrackets = (text: string): JSX.Element[] => {
        const regex = /\{([^}]+)\}/g;
        return text.split(regex).map((part, index) => {
            if (part.length === 1) {
                return <span key={index} className={styles.championsIcon}>{part}</span>;
            }
            return <React.Fragment key={index}>{part}</React.Fragment>;
        });
    };

    const handleTabClick = (index: number) => {
        setActivePrinting(index);
    };

    const uniquePrintings = card.Printings.filter(printing => printing.UniqueArt);
    let multiplePrintings = uniquePrintings.length > 1;
    var flavor = "";
    var packNumber = "";

    if (uniquePrintings.length > 0) {
        let printing = uniquePrintings[activePrinting];
        flavor = printing.Flavor ?? "";
        packNumber = printing.PackNumber;
    }

    return (
        <div>
            {multiplePrintings && (
                <div className={styles.tabs}>
                    <p>Printings:</p>
                    {uniquePrintings.map((printing, index) => (
                        <button
                            key={index}
                            className={`${styles.tab} ${index === activePrinting ? styles.activeTab : ''}`}
                            onClick={() => handleTabClick(index)}
                        >
                            {printing.PackNumber}
                        </button>
                    ))}
                </div>
            )}
            <div className={styles.cardDisplay}>
                <div className={styles.leftContent}>
                    <CardImage card={card} artificialId={uniquePrintings[activePrinting].ArtificialId} />
                </div>
                <div className={styles.rightContent}>
                    <h2>{card.Name} {card.Subname && "- " + card.Subname}</h2>
                    <p>Classification: {card.Classification}</p>
                    <p>Type: {card.Type}</p>
                    {card.Traits && card.Traits.length > 0 && (
                        <div>
                            <p>Traits: {card.Traits.join(", ")}</p>
                        </div>
                    )}
                    {card.Rules && <p>Rules: {applyCustomFontToBrackets(card.Rules)}</p>}
                    <p>Pack Number: {packNumber}</p>
                    {flavor != "" && (<p>Flavor: {flavor}</p>)}
                </div>
            </div>
        </div>
    );
};

export default CardDisplay;