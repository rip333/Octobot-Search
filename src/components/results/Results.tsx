import React, { useState } from 'react';
import styles from './Results.module.css';
import { Card } from "../../models/Card";
import CardImage from "../card-image/CardImage";
import Link from 'next/link';

interface ResultsProps {
    results: Array<Card>;
}

const Results: React.FC<ResultsProps> = ({ results }) => {
    const [activeClassifications, setActiveClassifications] = useState<string[]>([]);
    const [activeTypes, setActiveTypes] = useState<string[]>([]);

    // Determine unique classifications and types present in the results
    const uniqueClassifications = Array.from(new Set(results.map(card => card.Classification))).sort();
    const uniqueTypes = Array.from(new Set(results.map(card => card.Type))).sort();

    // Toggle classification filter
    const toggleClassificationFilter = (classification: string) => {
        setActiveClassifications(prev => {
            if (prev.includes(classification)) {
                return prev.filter(c => c !== classification);
            } else {
                return [...prev, classification];
            }
        });
    };

    // Toggle type filter
    const toggleTypeFilter = (type: string) => {
        setActiveTypes(prev => {
            if (prev.includes(type)) {
                return prev.filter(t => t !== type);
            } else {
                return [...prev, type];
            }
        });
    };

    const filteredResults = results.filter(card => {
        const classificationMatches = activeClassifications.length === 0 || activeClassifications.includes(card.Classification);
        const typeMatches = activeTypes.length === 0 || activeTypes.includes(card.Type);
        return classificationMatches && typeMatches;
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

    return (
        <div className={styles.resultsContainer}>
            <div className={styles.filterButtons}>
                {uniqueClassifications.length > 1 && uniqueClassifications.map(classification => (
                    <button
                        key={classification}
                        className={activeClassifications.includes(classification) ? styles.activeFilter : styles.inactiveFilter}
                        onClick={() => toggleClassificationFilter(classification)}
                    >
                        {classification} Cards
                    </button>
                ))}
            </div>
            <div className={styles.filterButtons}>
                {uniqueTypes.length > 1 && uniqueTypes.map(type => (
                    <button
                        key={type}
                        className={activeTypes.includes(type) ? styles.activeFilter : styles.inactiveFilter}
                        onClick={() => toggleTypeFilter(type)}
                    >
                        {type}
                    </button>
                ))}
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
};

export default Results;
