import React, { useState, useEffect, useMemo } from 'react';
import styles from './FilterOptions.module.css';
import { Card } from "../../models/Card";

interface FilterOptionsProps {
    results: Card[];
    onFilterChange: (filteredResults: Card[]) => void;
}

const FilterOptions: React.FC<FilterOptionsProps> = ({ results, onFilterChange }) => {
    const [activeClassifications, setActiveClassifications] = useState<string[]>([]);
    const [activeTypes, setActiveTypes] = useState<string[]>([]);
    const [activeTraits, setActiveTraits] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('id');
    const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState<boolean>(false);

    // Collapsible section states
    const [isClassificationOpen, setIsClassificationOpen] = useState<boolean>(true);
    const [isTypeOpen, setIsTypeOpen] = useState<boolean>(true);
    const [isTraitsOpen, setIsTraitsOpen] = useState<boolean>(true);

    // Reset filters when the base results change (e.g. new search)
    useEffect(() => {
        setActiveClassifications([]);
        setActiveTypes([]);
        setActiveTraits([]);
        setSortBy('id');
    }, [results]);

    const uniqueClassifications = useMemo(() => Array.from(new Set(results.map(card => card.Classification))).sort(), [results]);
    const hasPlayerCards = useMemo(() => results.some(card => card.Classification !== 'Encounter'), [results]);
    const hasEncounter = useMemo(() => uniqueClassifications.includes('Encounter'), [uniqueClassifications]);
    const classificationOptions = useMemo(() => (hasEncounter && hasPlayerCards) ? ['Player', ...uniqueClassifications] : uniqueClassifications, [hasEncounter, hasPlayerCards, uniqueClassifications]);

    const uniqueTypes = useMemo(() => Array.from(new Set(results.map(card => card.Type))).sort(), [results]);

    const uniqueTraits = useMemo(() => {
        const traitsSet = new Set<string>();
        results.forEach(card => {
            if (card.Traits) {
                card.Traits.forEach(t => traitsSet.add(t));
            }
        });
        return Array.from(traitsSet).sort();
    }, [results]);

    const toggleClassificationFilter = (classification: string) => {
        setActiveClassifications(prev => {
            if (prev.includes(classification)) return prev.filter(c => c !== classification);
            if (classification === 'Player') return [...prev.filter(c => c === 'Encounter'), 'Player'];
            if (classification === 'Encounter') return [...prev.filter(c => c !== 'Player'), 'Encounter'];
            const withoutPlayer = prev.filter(c => c !== 'Player');
            return [...withoutPlayer, classification];
        });
    };

    const toggleTypeFilter = (type: string) => {
        setActiveTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    const toggleTraitFilter = (trait: string) => {
        setActiveTraits(prev => prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait]);
    };

    const clearAllFilters = () => {
        setActiveClassifications([]);
        setActiveTypes([]);
        setActiveTraits([]);
    };

    useEffect(() => {
        const filtered = results.filter(card => {
            let classificationMatches = activeClassifications.length === 0;
            if (activeClassifications.length > 0) {
                const directMatch = activeClassifications.includes(card.Classification);
                const playerMatch = activeClassifications.includes('Player') && card.Classification !== 'Encounter';
                classificationMatches = directMatch || playerMatch;
            }

            const typeMatches = activeTypes.length === 0 || activeTypes.includes(card.Type);
            const traitMatches = activeTraits.length === 0 || activeTraits.some(t => card.Traits?.includes(t));

            return classificationMatches && typeMatches && traitMatches;
        }).sort((a, b) => {
            const parseValue = (val: string | undefined): number => {
                if (!val || val === '?') return -1;
                const parsed = parseInt(val, 10);
                return isNaN(parsed) ? -1 : parsed;
            };

            switch (sortBy) {
                case 'name': return a.Name.localeCompare(b.Name);
                case 'attack': return parseValue(b.Attack) - parseValue(a.Attack);
                case 'cost': return parseValue(a.Cost) - parseValue(b.Cost);
                case 'health': return parseValue(b.Health) - parseValue(a.Health);
                case 'thwart': return parseValue(b.Thwart) - parseValue(a.Thwart);
                case 'resource': return parseValue(b.Resource) - parseValue(a.Resource);
                case 'id':
                default:
                    const regex = /^(\d+)([A-Za-z]?)$/;
                    const matchA = a.Id.match(regex);
                    const matchB = b.Id.match(regex);
                    if (!matchA || !matchB) return a.Id.localeCompare(b.Id);
                    const numA = parseInt(matchA[1], 10);
                    const numB = parseInt(matchB[1], 10);
                    if (numA !== numB) return numA - numB;
                    return matchA[2].localeCompare(matchB[2]);
            }
        });

        onFilterChange(filtered);
    }, [results, activeClassifications, activeTypes, activeTraits, sortBy]);

    const totalActiveFilters = activeClassifications.length + activeTypes.length + activeTraits.length;
    const hasActiveFilters = totalActiveFilters > 0;

    // Optional: Calculate how many results each Type/Trait filter would return
    // Simple implementation doesn't disable chips for Traits, but displays them
    return (
        <div className={styles.container}>
            <div className={styles.quickFiltersBar}>
                <div className={styles.quickFilterItem}>
                    <label htmlFor="sort-select" className={styles.quickLabel}>Sort:</label>
                    <select id="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.compactDropdown}>
                        <option value="id">Card ID</option>
                        <option value="name">Name</option>
                        <option value="cost">Cost</option>
                        <option value="attack">Attack</option>
                        <option value="thwart">Thwart</option>
                        <option value="health">Health</option>
                        <option value="resource">Resource</option>
                    </select>
                </div>
                <button className={styles.advancedFiltersToggle} onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}>
                    <span>🔍</span>
                    <span>Filters</span>
                    {hasActiveFilters && <span className={styles.filterBadge}>{totalActiveFilters}</span>}
                    <span className={styles.chevron}>{advancedFiltersOpen ? '▲' : '▼'}</span>
                </button>
            </div>

            {hasActiveFilters && (
                <div className={styles.activeFiltersSummary}>
                    <span className={styles.summaryLabel}>Active filters:</span>
                    {activeClassifications.map(classification => (
                        <span key={classification} className={styles.activeChip}>
                            {classification} <button className={styles.chipRemove} onClick={() => toggleClassificationFilter(classification)}>×</button>
                        </span>
                    ))}
                    {activeTypes.map(type => (
                        <span key={type} className={styles.activeChip}>
                            {type} <button className={styles.chipRemove} onClick={() => toggleTypeFilter(type)}>×</button>
                        </span>
                    ))}
                    {activeTraits.map(trait => (
                        <span key={trait} className={styles.activeChip}>
                            {trait} <button className={styles.chipRemove} onClick={() => toggleTraitFilter(trait)}>×</button>
                        </span>
                    ))}
                    <button className={styles.clearAll} onClick={clearAllFilters}>Clear all</button>
                </div>
            )}

            {advancedFiltersOpen && (
                <div className={styles.advancedFiltersPanel}>
                    {classificationOptions.length > 1 && (
                        <div className={styles.filterGroup}>
                            <button
                                className={styles.filterSectionToggle}
                                onClick={() => setIsClassificationOpen(!isClassificationOpen)}
                                type="button"
                            >
                                <span className={styles.filterGroupLabel}>Classification</span>
                                <span className={styles.sectionChevron}>{isClassificationOpen ? '▲' : '▼'}</span>
                            </button>
                            {isClassificationOpen && (
                                <div className={styles.chipContainer}>
                                    {classificationOptions.map(classification => (
                                        <button key={classification} className={activeClassifications.includes(classification) ? styles.chipActive : styles.chip} onClick={() => toggleClassificationFilter(classification)}>
                                            {classification}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {uniqueTypes.length > 1 && (
                        <div className={styles.filterGroup}>
                            <button
                                className={styles.filterSectionToggle}
                                onClick={() => setIsTypeOpen(!isTypeOpen)}
                                type="button"
                            >
                                <span className={styles.filterGroupLabel}>Type</span>
                                <span className={styles.sectionChevron}>{isTypeOpen ? '▲' : '▼'}</span>
                            </button>
                            {isTypeOpen && (
                                <div className={styles.chipContainer}>
                                    {uniqueTypes.map(type => (
                                        <button key={type} className={activeTypes.includes(type) ? styles.chipActive : styles.chip} onClick={() => toggleTypeFilter(type)}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {uniqueTraits.length > 1 && (
                        <div className={styles.filterGroup}>
                            <button
                                className={styles.filterSectionToggle}
                                onClick={() => setIsTraitsOpen(!isTraitsOpen)}
                                type="button"
                            >
                                <span className={styles.filterGroupLabel}>Traits</span>
                                <span className={styles.sectionChevron}>{isTraitsOpen ? '▲' : '▼'}</span>
                            </button>
                            {isTraitsOpen && (
                                <div className={styles.chipContainer}>
                                    {uniqueTraits.map(trait => (
                                        <button key={trait} className={activeTraits.includes(trait) ? styles.chipActive : styles.chip} onClick={() => toggleTraitFilter(trait)}>
                                            {trait}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FilterOptions;
