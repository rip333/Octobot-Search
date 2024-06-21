// FilterOptions.tsx
import styles from './FilterOptions.module.css';
import React from 'react';

interface FilterOptionsProps {
    origin: string;
    setOrigin: React.Dispatch<React.SetStateAction<string>>;
}

const FilterOptions: React.FC<FilterOptionsProps> = ({ origin, setOrigin }) => {
    return (
        <div className={styles.container}>
            <div className={styles.radioContainer}>
                Origin:
                <label>
                    <input
                        type="radio"
                        name="origin"
                        value="all"
                        checked={origin === 'all'}
                        onChange={() => setOrigin('all')}
                    />
                    <span className={styles.labelText}>All</span>
                </label>
                <label>
                    <input
                        type="radio"
                        name="origin"
                        value="official"
                        checked={origin === 'official'}
                        onChange={() => setOrigin('official')}
                    />
                    <span className={styles.labelText}>Official</span>
                </label>
                <label>
                    <input
                        type="radio"
                        name="origin"
                        value="unofficial"
                        checked={origin === 'unofficial'}
                        onChange={() => setOrigin('unofficial')}
                    />
                    <span className={styles.labelText}>Unofficial</span>
                </label>
            </div>
        </div>
    );
};

export default FilterOptions;
