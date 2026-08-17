import React, { useMemo, useState } from 'react';
import styles from './Results.module.css';
import { Card } from "../../models/Card";
import CardImage from "../card-image/CardImage";
import Link from 'next/link';
import FilterOptions from '../filters/FilterOptions';
import { CEREBRO_BASE_URL } from '@/api/cerebro';
import { CardFilterState, EMPTY_CARD_FILTERS, filterAndSortCards } from '@/utils/cardFilters';
import { DownloadSimple, Link as LinkIcon } from '@phosphor-icons/react';

interface ResultsProps {
    results: Array<Card>;
    cerebroQuery?: string;
    detailsEnabled: boolean;
}

/*
 * Rendering strategy: plain list, no pagination or virtualization.
 *
 * Measured against live Cerebro: the largest official set is ~15 cards and the
 * largest pack (Core Set) is 209 cards / ~220 kB. Every card image lazy-loads,
 * so off-screen results cost a DOM node and nothing else. Revisit only if real
 * production usage shows result sizes an order of magnitude larger.
 */

const Results: React.FC<ResultsProps> = ({ results, cerebroQuery, detailsEnabled }) => {
    const [filters, setFilters] = useState<CardFilterState>(EMPTY_CARD_FILTERS);
    const [filteredResultSet, setFilteredResultSet] = useState<Card[]>(results);

    // A new result set clears the old selections explicitly. Sort order is a
    // stated preference rather than a property of the results, so it survives.
    if (results !== filteredResultSet) {
        setFilteredResultSet(results);
        setFilters(previous => ({ ...EMPTY_CARD_FILTERS, sortBy: previous.sortBy }));
    }

    const visibleCards = useMemo(() => filterAndSortCards(results, filters), [results, filters]);

    const exportResultsAsJson = () => {
        const dataStr = JSON.stringify(visibleCards, null, 2);
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
            <FilterOptions results={results} filters={filters} onFiltersChange={setFilters} />

            <div className={styles.resultsCount} role="status">
                {visibleCards.length} {visibleCards.length === 1 ? 'card' : 'cards'}
            </div>

            <ul className={styles.resultsList}>
                {visibleCards.map(card => (
                    <li key={card.Id} className={styles.resultItem}>
                        {detailsEnabled ? (
                            <Link href={`/card/${card.Id}`} aria-label={card.Name}>
                                <CardImage card={card} />
                            </Link>
                        ) : (
                            <CardImage card={card} />
                        )}
                    </li>
                ))}
            </ul>

            <div className={styles.utilityButtons}>
                <button
                    className={styles.exportButton}
                    onClick={exportResultsAsJson}
                    title="Export filtered results as JSON"
                >
                    <DownloadSimple size={20} weight="bold" aria-hidden="true" />
                    <span>Export JSON</span>
                </button>

                {cerebroQuery && (
                    <a
                        className={styles.apiButton}
                        href={`${CEREBRO_BASE_URL}/query?${cerebroQuery}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View API query in new tab"
                    >
                        <LinkIcon size={20} weight="bold" aria-hidden="true" />
                        <span>View API</span>
                    </a>
                )}
            </div>
        </div>
    );
};

export default Results;
