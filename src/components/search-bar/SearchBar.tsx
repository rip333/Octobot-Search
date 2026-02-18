import React, { useState, useEffect, useRef } from 'react';
import styles from './SearchBar.module.css'; // Import the CSS Module
import { useRouter } from 'next/router';
import { handleSearch } from '@/searchUtils';
import Link from 'next/link';

interface SearchBarProps {
    origin?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ origin = "official" }) => {
    const [searchText, setSearchText] = useState('');
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // Update searchText when the router query changes
    useEffect(() => {
        if (router.query.query && typeof router.query.query === 'string') {
            setSearchText(router.query.query);
        }

        // Autofocus logic for non-mobile devices
        const isNonMobile = window.innerWidth > 768; // Example breakpoint for mobile devices
        if (isNonMobile && inputRef.current) {
            inputRef.current.focus();
        }
    }, [router.query.query]);

    const handleForm = async (event: React.FormEvent) => {
        event.preventDefault()
        handleSearch(searchText, router, origin);
    };

    const handleOriginChange = (newOrigin: string) => {
        const { query } = router;
        if (newOrigin === 'official') {
            const { origin: _origin, ...rest } = query;
            router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
        } else {
            router.push({ pathname: router.pathname, query: { ...query, origin: newOrigin } }, undefined, { shallow: true });
        }
    };

    return (
        <div className={styles.search}>
            <form onSubmit={handleForm} className={styles.form}>
                <div className={styles.searchbox}>
                    <input
                        aria-label="Search"
                        placeholder="Search"
                        type="search"
                        value={searchText}
                        ref={inputRef}
                        required
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <div className={styles.searchContainer}>
                    <div className={styles.toggleLayout}>
                        <div className={styles.sourceToggle} role="group" aria-label="Card source">
                            <button
                                type="button"
                                aria-pressed={origin === 'official'}
                                onClick={() => handleOriginChange('official')}
                            >
                                ✔︎ Official
                            </button>
                            <button
                                type="button"
                                aria-pressed={origin === 'unofficial'}
                                onClick={() => handleOriginChange('unofficial')}
                            >
                                ✦ Unofficial
                            </button>
                        </div>
                    </div>
                    <button type="submit" className={styles.searchButton}>Search</button>
                </div>
            </form>
        </div>
    );
};

export default SearchBar;
