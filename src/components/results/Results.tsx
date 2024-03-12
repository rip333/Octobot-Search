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

    const filteredResults = results.filter(card => {
        if (showEncounter === null) return true; 
        return showEncounter ? card.Classification === "Encounter" : card.Classification !== "Encounter";
    }).sort((a, b) => {
        const regex = /^(\d+)([A-Za-z]?)$/;
    
        const matchA = a.Id.match(regex);
        const matchB = b.Id.match(regex);
    
        if (!matchA || !matchB) {
            return a.Id.localeCompare(b.Id);
        }
    
        const numA = parseInt(matchA[1], 10);
        const numB = parseInt(matchB[1], 10);
    
        if (numA !== numB) {
            return numA - numB;
        }
    
        return matchA[2].localeCompare(matchB[2]);
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
