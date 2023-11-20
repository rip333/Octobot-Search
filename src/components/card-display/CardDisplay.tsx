import { Card } from "@/models/Card";
import CardImage from "../card-image/CardImage";
import styles from './CardDisplay.module.css'; // Import the CSS Module
import React from "react";

interface CardProps {
    card: Card;
}

const CardDisplay: React.FC<CardProps> = ({ card }) => {

    const applyCustomFontToBrackets = (text: string): JSX.Element[] => {
        const regex = /\{([^}]+)\}/g;
        return text.split(regex).map((part, index) => {
            if (part.length === 1) {
                return <span key={index} className={styles.championsIcon}>{part}</span>;
            }
            return <React.Fragment key={index}>{part}</React.Fragment>;
        });
    };

    return (
        <div className={styles.cardDisplay}>
            <div className={styles.leftContent}>
                <CardImage card={card} />
            </div>
            <div className={styles.rightContent}>
                <h2>{card.Name} {card.Subname && "- " + card.Subname}</h2>
                <p>Classification: {card.Classification}</p>
                <p>Type: {card.Type}</p>
                {card.Traits && card.Traits.length > 0 && (
                    <div>
                        <p>Traits:</p>
                        <ul>
                            {card.Traits.map(trait => <li key={trait}>{trait}</li>)}
                        </ul>
                    </div>
                )}
                {card.Rules && <p>Rules: {applyCustomFontToBrackets(card.Rules)}</p>}
                {card.Printings.length > 0 && (
                    <div>
                        <p>Printings:</p>
                        {card.Printings.map(printing => (
                            <div key={printing.ArtificialId}>
                                <p>Pack Number: {printing.PackNumber}</p>
                                {printing.Flavor && <p>Flavor: {printing.Flavor}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardDisplay;