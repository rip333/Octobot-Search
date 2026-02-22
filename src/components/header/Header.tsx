import React from 'react';
import styles from './Header.module.css'; // Import the CSS Module
import logo from '../../logo.png';
import textLogo from "../../icon-text.png";
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  miniLogo: boolean;
}

const Header: React.FC<HeaderProps> = ({ miniLogo }) => {

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
    </div>);
};

export default Header;
