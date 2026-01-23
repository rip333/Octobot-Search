import React, { useState } from 'react';
import styles from './Results.module.css';
import { Card } from "../../models/Card";
import CardImage from "../card-image/CardImage";
import Link from 'next/link';

interface ResultsProps {
    results: Array<Card>;
    cerebroQuery?: string;
}

const Results: React.FC<ResultsProps> = ({ results, cerebroQuery }) => {
    const [activeClassifications, setActiveClassifications] = useState<string[]>([]);
    const [activeTypes, setActiveTypes] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('id');
    const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState<boolean>(false);

    // Determine unique classifications and types present in the results
    const uniqueClassifications = Array.from(new Set(results.map(card => card.Classification))).sort();
    // Add "Player Card" if there are any non-Encounter cards
    const hasPlayerCards = results.some(card => card.Classification !== 'Encounter');
    const classificationOptions = hasPlayerCards ? ['Player', ...uniqueClassifications] : uniqueClassifications;
    const uniqueTypes = Array.from(new Set(results.map(card => card.Type))).sort();

    // Toggle classification filter with smart logic
    const toggleClassificationFilter = (classification: string) => {
        setActiveClassifications(prev => {
            // If already selected, just remove it
            if (prev.includes(classification)) {
                return prev.filter(c => c !== classification);
            }
            
            // If selecting "Player"
            if (classification === 'Player') {
                // Remove any specific non-Encounter classifications, add Player
                // Keep Encounter if it was selected (though they're mutually exclusive in filtering)
                return [...prev.filter(c => c === 'Encounter'), 'Player'];
            }
            
            // If selecting "Encounter"
            if (classification === 'Encounter') {
                // Remove Player if selected, add Encounter
                return [...prev.filter(c => c !== 'Player'), 'Encounter'];
            }
            
            // If selecting a specific classification (Justice, Protection, etc.)
            // Remove "Player" if it's active, since specific filters take precedence
            const withoutPlayer = prev.filter(c => c !== 'Player');
            return [...withoutPlayer, classification];
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
        // Smart classification filtering
        let classificationMatches = activeClassifications.length === 0;
        
        if (activeClassifications.length > 0) {
            // Check if card's classification is in the active filters
            const directMatch = activeClassifications.includes(card.Classification);
            
            // Check if "Player" filter is active and card is non-Encounter
            const playerMatch = activeClassifications.includes('Player') && 
                                card.Classification !== 'Encounter';
            
            classificationMatches = directMatch || playerMatch;
        }
        
        const typeMatches = activeTypes.length === 0 || activeTypes.includes(card.Type);
        return classificationMatches && typeMatches;
    }).sort((a, b) => {
        // Helper function to parse numeric values, treating '?' or undefined as -1
        const parseValue = (val: string | undefined): number => {
            if (!val || val === '?') return -1;
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? -1 : parsed;
        };

        switch (sortBy) {
            case 'name':
                return a.Name.localeCompare(b.Name);
            case 'attack':
                return parseValue(b.Attack) - parseValue(a.Attack);
            case 'cost':
                return parseValue(a.Cost) - parseValue(b.Cost);
            case 'health':
                return parseValue(b.Health) - parseValue(a.Health);
            case 'thwart':
                return parseValue(b.Thwart) - parseValue(a.Thwart);
            case 'resource':
                return parseValue(b.Resource) - parseValue(a.Resource);
            case 'id':
            default:
                // Original ID sorting logic
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
        }
    });

    const totalActiveFilters = activeClassifications.length + activeTypes.length;
    const hasActiveFilters = totalActiveFilters > 0;

    // Calculate how many results each Type filter would return based on current Classification filters
    const typeResultCounts = uniqueTypes.reduce((counts, type) => {
        const count = results.filter(card => {
            // Apply classification filter logic
            let classificationMatches = activeClassifications.length === 0;
            
            if (activeClassifications.length > 0) {
                const directMatch = activeClassifications.includes(card.Classification);
                const playerMatch = activeClassifications.includes('Player') && 
                                    card.Classification !== 'Encounter';
                classificationMatches = directMatch || playerMatch;
            }
            
            // Check if this card matches the type we're counting
            return classificationMatches && card.Type === type;
        }).length;
        
        counts[type] = count;
        return counts;
    }, {} as Record<string, number>);

    const clearAllFilters = () => {
        setActiveClassifications([]);
        setActiveTypes([]);
    };

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
            {/* Quick Filters Bar */}
            <div className={styles.quickFiltersBar}>
                <div className={styles.quickFilterItem}>
                    <label htmlFor="sort-select" className={styles.quickLabel}>Sort:</label>
                    <select 
                        id="sort-select"
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className={styles.compactDropdown}
                    >
                        <option value="id">Card ID</option>
                        <option value="name">Name</option>
                        <option value="cost">Cost</option>
                        <option value="attack">Attack</option>
                        <option value="thwart">Thwart</option>
                        <option value="health">Health</option>
                        <option value="resource">Resource</option>
                    </select>
                </div>
                
                <button 
                    className={styles.advancedFiltersToggle}
                    onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
                >
                    <span>🔍</span>
                    <span>Filters</span>
                    {hasActiveFilters && <span className={styles.filterBadge}>{totalActiveFilters}</span>}
                    <span className={styles.chevron}>{advancedFiltersOpen ? '▲' : '▼'}</span>
                </button>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
                <div className={styles.activeFiltersSummary}>
                    <span className={styles.summaryLabel}>Active filters:</span>
                    {activeClassifications.map(classification => (
                        <span key={classification} className={styles.activeChip}>
                            {classification}
                            <button 
                                className={styles.chipRemove}
                                onClick={() => toggleClassificationFilter(classification)}
                                aria-label={`Remove ${classification} filter`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    {activeTypes.map(type => (
                        <span key={type} className={styles.activeChip}>
                            {type}
                            <button 
                                className={styles.chipRemove}
                                onClick={() => toggleTypeFilter(type)}
                                aria-label={`Remove ${type} filter`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <button className={styles.clearAll} onClick={clearAllFilters}>
                        Clear all
                    </button>
                </div>
            )}

            {/* Advanced Filters Panel */}
            {advancedFiltersOpen && (
                <div className={styles.advancedFiltersPanel}>
                    <div className={styles.filterGroup}>
                        <label className={styles.filterGroupLabel}>Classification</label>
                        <div className={styles.chipContainer}>
                            {classificationOptions.map(classification => (
                                <button
                                    key={classification}
                                    className={activeClassifications.includes(classification) ? styles.chipActive : styles.chip}
                                    onClick={() => toggleClassificationFilter(classification)}
                                >
                                    {classification}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className={styles.filterGroup}>
                        <label className={styles.filterGroupLabel}>Type</label>
                        <div className={styles.chipContainer}>
                            {uniqueTypes.map(type => {
                                const count = typeResultCounts[type];
                                const isDisabled = count === 0;
                                const isActive = activeTypes.includes(type);
                                
                                return (
                                    <button
                                        key={type}
                                        className={
                                            isDisabled ? styles.chipDisabled : 
                                            isActive ? styles.chipActive : 
                                            styles.chip
                                        }
                                        onClick={() => !isDisabled && toggleTypeFilter(type)}
                                        disabled={isDisabled}
                                    >
                                        {type} <span className={styles.chipCount}>({count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Results Count */}
            <div className={styles.resultsCount}>
                {filteredResults.length} {filteredResults.length === 1 ? 'card' : 'cards'}
            </div>

            <ul className={styles.resultsList}>
                {filteredResults.map((card, index) => (
                    <Link key={index} href={`/card/${card.Id}`}>
                        <CardImage card={card} />
                    </Link>
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
