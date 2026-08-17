import React, { useMemo, useState } from 'react';
import styles from './FilterOptions.module.css';
import { Card } from "../../models/Card";
import {
    CardFilterState,
    CardSortKey,
    EMPTY_CARD_FILTERS,
    deriveCardFacets,
    toggleClassification,
    toggleValue,
} from '@/utils/cardFilters';
import { Funnel, SortAscending } from "@phosphor-icons/react";

interface FilterOptionsProps {
    results: Card[];
    filters: CardFilterState;
    onFiltersChange: (filters: CardFilterState) => void;
}

const SORT_OPTIONS: Array<{ value: CardSortKey; label: string }> = [
    { value: 'id', label: 'Card ID' },
    { value: 'name', label: 'Name' },
    { value: 'cost', label: 'Cost (low to high)' },
    { value: 'attack', label: 'Attack (high to low)' },
    { value: 'thwart', label: 'Thwart (high to low)' },
    { value: 'health', label: 'Health (high to low)' },
    // Resources are icons, so this groups by icon rather than comparing values.
    { value: 'resource', label: 'Resource icon' },
];

const isSortKey = (value: string): value is CardSortKey =>
    SORT_OPTIONS.some(option => option.value === value);

const FilterOptions: React.FC<FilterOptionsProps> = ({ results, filters, onFiltersChange }) => {
    const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
    const [isClassificationOpen, setIsClassificationOpen] = useState(true);
    const [isTypeOpen, setIsTypeOpen] = useState(true);
    const [isTraitsOpen, setIsTraitsOpen] = useState(true);

    const facets = useMemo(() => deriveCardFacets(results), [results]);

    const setClassifications = (classification: string) =>
        onFiltersChange({ ...filters, classifications: toggleClassification(filters.classifications, classification) });
    const setTypes = (type: string) =>
        onFiltersChange({ ...filters, types: toggleValue(filters.types, type) });
    const setTraits = (trait: string) =>
        onFiltersChange({ ...filters, traits: toggleValue(filters.traits, trait) });
    const clearAllFilters = () =>
        onFiltersChange({ ...EMPTY_CARD_FILTERS, sortBy: filters.sortBy });

    const totalActiveFilters =
        filters.classifications.length + filters.types.length + filters.traits.length;
    const hasActiveFilters = totalActiveFilters > 0;

    return (
        <div className={styles.container}>
            <div className={styles.quickFiltersBar}>
                <div className={styles.quickFilterItem} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <SortAscending size={18} weight="bold" aria-hidden="true" />
                    <label htmlFor="sort-select" className={styles.quickLabel}>Sort:</label>
                    <select
                        id="sort-select"
                        value={filters.sortBy}
                        onChange={event => {
                            const next = event.target.value;
                            if (isSortKey(next)) onFiltersChange({ ...filters, sortBy: next });
                        }}
                        className={styles.compactDropdown}
                    >
                        {SORT_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    className={styles.advancedFiltersToggle}
                    onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
                    aria-expanded={advancedFiltersOpen}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                    <Funnel size={16} weight="bold" aria-hidden="true" />
                    <span>Filters</span>
                    {hasActiveFilters && <span className={styles.filterBadge}>{totalActiveFilters}</span>}
                    <span className={styles.chevron} aria-hidden="true">{advancedFiltersOpen ? '▲' : '▼'}</span>
                </button>
            </div>

            {hasActiveFilters && (
                <div className={styles.activeFiltersSummary}>
                    <span className={styles.summaryLabel}>Active filters:</span>
                    {filters.classifications.map(classification => (
                        <span key={classification} className={styles.activeChip}>
                            {classification}
                            <button
                                type="button"
                                className={styles.chipRemove}
                                aria-label={`Remove ${classification} filter`}
                                onClick={() => setClassifications(classification)}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    {filters.types.map(type => (
                        <span key={type} className={styles.activeChip}>
                            {type}
                            <button
                                type="button"
                                className={styles.chipRemove}
                                aria-label={`Remove ${type} filter`}
                                onClick={() => setTypes(type)}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    {filters.traits.map(trait => (
                        <span key={trait} className={styles.activeChip}>
                            {trait}
                            <button
                                type="button"
                                className={styles.chipRemove}
                                aria-label={`Remove ${trait} filter`}
                                onClick={() => setTraits(trait)}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <button type="button" className={styles.clearAll} onClick={clearAllFilters}>Clear all</button>
                </div>
            )}

            {advancedFiltersOpen && (
                <div className={styles.advancedFiltersPanel}>
                    <p className={styles.filterHint}>
                        Within a group, a card matches if it has <strong>any</strong> selected value.
                        Groups combine: a card must match every group you filter on.
                    </p>

                    {facets.classifications.length > 1 && (
                        <div className={styles.filterGroup}>
                            <button
                                className={styles.filterSectionToggle}
                                onClick={() => setIsClassificationOpen(!isClassificationOpen)}
                                aria-expanded={isClassificationOpen}
                                type="button"
                            >
                                <span className={styles.filterGroupLabel}>Classification</span>
                                <span className={styles.sectionChevron} aria-hidden="true">{isClassificationOpen ? '▲' : '▼'}</span>
                            </button>
                            {isClassificationOpen && (
                                <div className={styles.chipContainer}>
                                    {facets.classifications.map(classification => (
                                        <button
                                            key={classification}
                                            type="button"
                                            aria-pressed={filters.classifications.includes(classification)}
                                            className={filters.classifications.includes(classification) ? styles.chipActive : styles.chip}
                                            onClick={() => setClassifications(classification)}
                                        >
                                            {classification}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {facets.types.length > 1 && (
                        <div className={styles.filterGroup}>
                            <button
                                className={styles.filterSectionToggle}
                                onClick={() => setIsTypeOpen(!isTypeOpen)}
                                aria-expanded={isTypeOpen}
                                type="button"
                            >
                                <span className={styles.filterGroupLabel}>Type</span>
                                <span className={styles.sectionChevron} aria-hidden="true">{isTypeOpen ? '▲' : '▼'}</span>
                            </button>
                            {isTypeOpen && (
                                <div className={styles.chipContainer}>
                                    {facets.types.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            aria-pressed={filters.types.includes(type)}
                                            className={filters.types.includes(type) ? styles.chipActive : styles.chip}
                                            onClick={() => setTypes(type)}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {facets.traits.length > 1 && (
                        <div className={styles.filterGroup}>
                            <button
                                className={styles.filterSectionToggle}
                                onClick={() => setIsTraitsOpen(!isTraitsOpen)}
                                aria-expanded={isTraitsOpen}
                                type="button"
                            >
                                <span className={styles.filterGroupLabel}>Traits</span>
                                <span className={styles.sectionChevron} aria-hidden="true">{isTraitsOpen ? '▲' : '▼'}</span>
                            </button>
                            {isTraitsOpen && (
                                <div className={styles.chipContainer}>
                                    {facets.traits.map(trait => (
                                        <button
                                            key={trait}
                                            type="button"
                                            aria-pressed={filters.traits.includes(trait)}
                                            className={filters.traits.includes(trait) ? styles.chipActive : styles.chip}
                                            onClick={() => setTraits(trait)}
                                        >
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
