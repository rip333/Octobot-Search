import React from 'react';
import styles from './Results.module.css';
import { Card } from "../../models/Card";
import CardImage from "../card-image/CardImage";

interface ResultsProps {
    results: Array<Card>; // Use a more specific type depending on your actual data structure
}

const Results: React.FC<ResultsProps> = ({ results }) => {
    
    if (results.length > 0) {
        return (
            <div className={styles.resultsContainer}>
                <ul className={styles.resultsList}>
                    {results.map((card, index) => (
                        <CardImage key={index} card={card} />
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
