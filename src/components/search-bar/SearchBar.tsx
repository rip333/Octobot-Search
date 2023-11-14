import React, { useState, useEffect } from 'react';
import styles from './SearchBar.module.css'; // Import the CSS Module
import { useRouter } from 'next/router';
import { handleSearch } from '@/searchUtils';

interface SearchBarProps {
    incomplete?: boolean;
    origin?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ incomplete, origin }) => {
    const [searchText, setSearchText] = useState('');
    const router = useRouter();

    // Update searchText when the router query changes
    useEffect(() => {
        if (router.query.query && typeof router.query.query === 'string') {
            setSearchText(router.query.query);
        }
    }, [router.query.query]);

    const handleForm = async (event: React.FormEvent) => {
        event.preventDefault()
        handleSearch(searchText, router, incomplete, origin);
    };

    return (
        <div>
            <form onSubmit={handleForm} className={styles.form}>
                <div className={styles.searchbox}>
                    <input
                        aria-label="Search"
                        placeholder="Search"
                        type="search"
                        value={searchText}
                        autoFocus required
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
