// FilterOptions.tsx
import styles from './FilterOptions.module.css';
import React from 'react';

interface FilterOptionsProps {
    incomplete: boolean;
    setIncomplete: React.Dispatch<React.SetStateAction<boolean>>;
    origin: string;
    setOrigin: React.Dispatch<React.SetStateAction<string>>;
}

const FilterOptions: React.FC<FilterOptionsProps> = ({ incomplete, setIncomplete, origin, setOrigin }) => {
    return (
        <div className={styles.container}>
            <div className={styles.checkboxContainer}>
                <label title={"Differentiate between products that have been officially released and those that have yet to be officially released"}>
                    <input
                        type="checkbox"
                        checked={incomplete}
                        onChange={e => setIncomplete(e.target.checked)}
                    />
                    <span className={styles.labelText}>Incomplete</span>
                </label>
            </div>|&nbsp;&nbsp;
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
