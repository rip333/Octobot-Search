import React from 'react';
import styles from './Results.module.css';
import { Card } from "../../models/Card";
import CardImage from "../card-image/CardImage";
import Link from 'next/link';

interface ResultsProps {
    results: Array<Card>;
    loading: boolean;
}

const Results: React.FC<ResultsProps> = ({ results, loading }) => {

    if (results.length > 0 || loading) {
        return (
            <div className={styles.resultsContainer}>
                <ul className={styles.resultsList}>
                    {results.map((card, index) => (
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
