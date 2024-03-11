import React, { useState } from 'react';
import styles from './Header.module.css'; // Import the CSS Module
import SearchBar from '../search-bar/SearchBar';
import logo from '../../logo.png';
import textLogo from "../../icon-text.png";
import FilterOptions from '../filters/FilterOptions';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  miniLogo: boolean;
}

const Header: React.FC<HeaderProps> = ({ miniLogo }) => {
  const [incomplete, setIncomplete] = useState(false);
  const [origin, setOrigin] = useState('official');

  return (
    <div className={styles.OctobotHeader}>
      {miniLogo ?
        <Link className={styles.OctobotMiniLogo} href="/">
          <Image src={textLogo} alt="logo" />
        </Link>
        :
        <>
          <Link href="/">
            <Image src={logo} className={styles.OctobotLogo} alt="logo" />
          </Link>
          <Link href="/">
            <Image src={textLogo} className={styles.OctobotMobileLogo} alt="logo" />
          </Link>
        </>
      }
      <SearchBar origin={origin} incomplete={incomplete} />
      <FilterOptions
        incomplete={incomplete}
        setIncomplete={setIncomplete}
        origin={origin}
        setOrigin={setOrigin}
      />
    </div>);
};

export default Header;
