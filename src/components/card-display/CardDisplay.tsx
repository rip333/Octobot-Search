import { Card } from "@/models/Card";
import CardImage from "../card-image/CardImage";
import styles from './CardDisplay.module.css';
import React, { useState } from "react";
import { tokenizeCardRules } from "@/utils/cardRules";

interface CardProps {
    card: Card;
}

const printingKeyOf = (printing: Card['Printings'][number], index: number) =>
    `${printing.ArtificialId}:${printing.PackId}:${printing.PackNumber}:${index}`;

const CardDisplay: React.FC<CardProps> = ({ card }) => {
    const [activePrintingKey, setActivePrintingKey] = useState<string | null>(null);

    const applyCustomFontToBrackets = (text: string): React.ReactElement[] =>
        tokenizeCardRules(text).map((token, index) => {
            if (token.type === 'icon') {
                return <span key={index} className={styles.championsIcon}>{token.value}</span>;
            }
            return <React.Fragment key={index}>{token.value}</React.Fragment>;
        });

    const uniquePrintings = card.Printings.filter(printing => printing.UniqueArt);
    const usablePrintings = uniquePrintings.length > 0 ? uniquePrintings : card.Printings;

    // A key that is no longer in the list (the card changed) falls back to the
    // first printing, so the active index can never go out of range.
    const activePrintingIndex = activePrintingKey
        ? usablePrintings.findIndex((printing, index) => printingKeyOf(printing, index) === activePrintingKey)
        : 0;
    const selectedPrinting = usablePrintings[activePrintingIndex >= 0 ? activePrintingIndex : 0];
    const multiplePrintings = usablePrintings.length > 1;
    const flavor = selectedPrinting?.Flavor ?? "";
    const packNumber = selectedPrinting?.PackNumber ?? "";

    return (
        <div>
            {multiplePrintings && (
                <div className={styles.tabs}>
                    <p id="printings-label">Printings:</p>
                    <div role="group" aria-labelledby="printings-label">
                        {usablePrintings.map((printing, index) => {
                            const printingKey = printingKeyOf(printing, index);
                            const isActive = printing === selectedPrinting;
                            return (
                                <button
                                    key={printingKey}
                                    type="button"
                                    aria-pressed={isActive}
                                    className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}
                                    onClick={() => setActivePrintingKey(printingKey)}
                                >
                                    {printing.PackNumber || `#${index + 1}`}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            <div className={styles.cardDisplay}>
                <div className={styles.leftContent}>
                    <CardImage card={card} artificialId={selectedPrinting?.ArtificialId ?? card.Id} />
                    {card.BackImageUrl && (
                        <CardImage card={card} artificialId={selectedPrinting?.ArtificialId ?? card.Id} showBack />
                    )}
                </div>
                <div className={styles.rightContent}>
                    <h1>{card.Name} {card.Subname && "- " + card.Subname}</h1>
                    <p>Classification: {card.Classification}</p>
                    <p>Type: {card.Type}</p>
                    {card.Traits && card.Traits.length > 0 && (
                        <p>Traits: {card.Traits.join(", ")}</p>
                    )}
                    {card.Rules && <p>Rules: {applyCustomFontToBrackets(card.Rules)}</p>}
                    {packNumber && <p>Pack Number: {packNumber}</p>}
                    {flavor !== "" && (<p>Flavor: {flavor}</p>)}
                </div>
            </div>
        </div>
    );
};

export default CardDisplay;
