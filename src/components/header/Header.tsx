import React, { useState } from 'react';
import styles from './Header.module.css'; // Import the CSS Module
import SearchBar from '../search-bar/SearchBar';
import logo from '../../logo.png';
import { createSearchQuery } from "./searchUtils";
import FilterOptions from '../filters/FilterOptions';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router'; // Import useRouter

const Header: React.FC = ({ }) => {
  const [incomplete, setIncomplete] = useState(false);
  const [origin, setOrigin] = useState('official');
  const router = useRouter(); // Initialize useRouter

  const handleSearch = async (query: string) => {
    const filterOptions = {
      incomplete: incomplete,
      origin: origin,
    };
    const searchQuery = createSearchQuery(query, filterOptions);

    router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className={styles.OctobotHeader}>
      <Link href="/">
        <Image src={logo} className={styles.OctobotLogo} alt="logo" />
      </Link>
      <SearchBar handleSearch={handleSearch} />
      <FilterOptions
        incomplete={incomplete}
        setIncomplete={setIncomplete}
        origin={origin}
        setOrigin={setOrigin}
      />
    </div>);
};

export default Header;
