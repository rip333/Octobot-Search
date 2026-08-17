import React from 'react';
import styles from './Header.module.css';
import logo from '../../logo.png';
import textLogo from "../../icon-text.png";
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  miniLogo: boolean;
}

const Header: React.FC<HeaderProps> = ({ miniLogo }) => (
  <header className={styles.OctobotHeader}>
    {miniLogo ? (
      <Link className={styles.OctobotMiniLogo} href="/">
        <Image src={textLogo} alt="Octobot Search home" priority />
      </Link>
    ) : (
      <>
        <Link href="/">
          <Image src={logo} className={styles.OctobotLogo} alt="Octobot Search home" priority />
        </Link>
        <Link href="/" aria-hidden="true" tabIndex={-1}>
          {/* Mobile-only duplicate of the link above; hidden from assistive tech
              so the same destination is not announced twice. */}
          <Image src={textLogo} className={styles.OctobotMobileLogo} alt="" />
        </Link>
      </>
    )}
  </header>
);

export default Header;
