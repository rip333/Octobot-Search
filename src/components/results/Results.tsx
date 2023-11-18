import React, { useState } from 'react';
import styles from './Results.module.css';
import { Card } from "../../models/Card";
import CardImage from "../card-image/CardImage";
import Link from 'next/link';

interface ResultsProps {
    results: Array<Card>;
    loading: boolean;
}

const Results: React.FC<ResultsProps> = ({ results, loading }) => {
    const [showEncounter, setShowEncounter] = useState<boolean | null>(null);
    // Filtered results based on the toggle state
    const filteredResults = results.filter(card => {
        if (showEncounter === null) return true; // Show all if no filter is selected
        return showEncounter ? card.Classification === "Encounter" : card.Classification !== "Encounter";
    });


    if (results.length > 0 || loading) {
        return (
            <div className={styles.resultsContainer}>
                <div className={styles.filterButtons}>
                    <button className={showEncounter === null ? styles.activeFilter : styles.inactiveFilter} onClick={() => setShowEncounter(null)}>All Cards</button>
                    <button className={showEncounter ? styles.activeFilter : styles.inactiveFilter} onClick={() => setShowEncounter(true)}>Encounter Cards</button>
                    <button className={showEncounter === false ? styles.activeFilter : styles.inactiveFilter} onClick={() => setShowEncounter(false)}>Hero Cards</button>
                </div>
                <ul className={styles.resultsList}>
                    {filteredResults.map((card, index) => (
                        <Link key={index} href={`/card/${card.Id}`}>
                            <CardImage card={card} />
                        </Link>
                    ))}
                </ul>
            </div>
        );
    }
    return (
        <div className={styles.NoResults}>
            <p>No results to display.</p>
        </div>
    );
};

export default Results;
