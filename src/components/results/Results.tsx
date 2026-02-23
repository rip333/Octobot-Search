import React, { useState, useEffect } from 'react';
import styles from './Results.module.css';
import { Card } from "../../models/Card";
import CardImage from "../card-image/CardImage";
import Link from 'next/link';
import FilterOptions from '../filters/FilterOptions';

interface ResultsProps {
    results: Array<Card>;
    cerebroQuery?: string;
    detailsEnabled: boolean;
}

const Results: React.FC<ResultsProps> = ({ results, cerebroQuery, detailsEnabled }) => {
    const [filteredResults, setFilteredResults] = useState<Card[]>(results);

    // Initial setting, but FilterOptions will immediately run its useEffect and override this.
    // However, keeping this ensures it's set before FilterOptions resolves if there's any delay.
    useEffect(() => {
        setFilteredResults(results);
    }, [results]);

    const exportResultsAsJson = () => {
        const dataStr = JSON.stringify(filteredResults, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `card-results-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className={styles.resultsContainer}>
            <FilterOptions results={results} onFilterChange={setFilteredResults} />

            {/* Results Count */}
            <div className={styles.resultsCount}>
                {filteredResults.length} {filteredResults.length === 1 ? 'card' : 'cards'}
            </div>

            <ul className={styles.resultsList}>
                {filteredResults.map((card, index) => (
                    //return CardImage wrapped in link if detailsEnabled.  Otherwise, just return CardImage
                    detailsEnabled ? (
                        <Link key={index} href={`/card/${card.Id}`}>
                            <CardImage card={card} />
                        </Link>
                    ) : (
                        <CardImage key={index} card={card} />
                    )
                ))}
            </ul>

            {/* Utility Buttons */}
            <div className={styles.utilityButtons}>
                <button
                    className={styles.exportButton}
                    onClick={exportResultsAsJson}
                    title="Export filtered results as JSON"
                >
                    <span>💾</span>
                    <span>Export JSON</span>
                </button>

                {cerebroQuery && (
                    <button
                        className={styles.apiButton}
                        onClick={() => window.open(`https://cerebro-beta-bot.herokuapp.com/query?${cerebroQuery}`, '_blank')}
                        title="View API query in new tab"
                    >
                        <span>🔗</span>
                        <span>View API</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Results;
