import React, { useState } from 'react';
import styles from './SearchBar.module.css'; // Import the CSS Module
import {  useRouter } from 'next/router';
import { handleSearch } from '@/searchUtils';

interface SearchBarProps {
    incomplete?: boolean;
    origin?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ incomplete, origin }) => {
    const [query, setQuery] = useState('');
    const router = useRouter();
    const handleForm = async (event: React.FormEvent) => {
        event.preventDefault()
        handleSearch(query, router, incomplete, origin);
    };

    return (
        <div>
            <form onSubmit={handleForm} className={styles.form}>
                <div className={styles.searchbox}>
                    <input
                        aria-label="Search"
                        placeholder="Search"
                        type="search"
                        value={query}
                        autoFocus required
                        onChange={(e) => setQuery(e.target.value)}
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
