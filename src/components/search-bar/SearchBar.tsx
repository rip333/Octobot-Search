import React, { useState, useEffect, useRef } from 'react';
import styles from './SearchBar.module.css'; // Import the CSS Module
import { useRouter } from 'next/router';
import { handleSearch } from '@/searchUtils';

const SearchBar: React.FC = () => {
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
        handleSearch(searchText, router);
    };

    return (
        <div className={styles.search}>
            <form onSubmit={handleForm} className={styles.form}>
                <div className={styles.searchbox}>
                    <input
                        aria-label="Search"
                        placeholder="Search for Marvel Champions cards (official only)"
                        type="search"
                        value={searchText}
                        ref={inputRef}
                        required
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <div className={styles.searchContainer}>
                    <button type="submit" className={styles.searchButton}>Search</button>
                </div>
            </form>
        </div>
    );
};

export default SearchBar;
