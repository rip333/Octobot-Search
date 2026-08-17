import React, { useEffect, useRef } from 'react';
import styles from './SearchBar.module.css'; // Import the CSS Module
import { useRouter } from 'next/router';
import { handleSearch } from '@/searchUtils';
import { MagnifyingGlass } from "@phosphor-icons/react";

const SearchBar: React.FC = () => {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const routeSearchText = typeof router.query.query === 'string' ? router.query.query : '';

    useEffect(() => {
        // Autofocus logic for non-mobile devices
        const isNonMobile = window.innerWidth > 768; // Example breakpoint for mobile devices
        if (isNonMobile && inputRef.current) {
            inputRef.current.focus();
        }
    }, [router.query.query]);

    const handleForm = async (event: React.FormEvent) => {
        event.preventDefault()
        const searchText = inputRef.current?.value.trim() ?? '';
        if (searchText) {
            handleSearch(searchText, router);
        }
    };

    return (
        <div className={styles.search}>
            <form onSubmit={handleForm} className={styles.form}>
                <div className={styles.searchbox} style={{ position: 'relative' }}>
                    <MagnifyingGlass size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                    <input
                        aria-label="Search"
                        placeholder="Search for Marvel Champions cards (official only)"
                        type="search"
                        key={routeSearchText}
                        defaultValue={routeSearchText}
                        ref={inputRef}
                        required
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
                <div className={styles.searchContainer}>
                    <button type="submit" className={styles.searchButton} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MagnifyingGlass size={16} weight="bold" /> Search
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SearchBar;
