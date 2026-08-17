import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => (
    <footer className={styles.footer}>
        <nav aria-label="Project and data sources">
            <ul className={styles.links}>
                <li className={styles.linkItem}>
                    <a
                        href="https://github.com/rip333/Octobot-Search"
                        className={styles.link}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Github
                    </a>
                </li>
                <li className={styles.linkItem}>
                    Powered by:{' '}
                    <a
                        href="https://github.com/UnicornSnuggler/Cerebro"
                        className={styles.link}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Cerebro
                    </a>
                </li>
                <li className={styles.linkItem}>
                    Powered by:{' '}
                    <a
                        href="https://mc4db.merlindumesnil.net/api/"
                        className={styles.link}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        mc4db.merlindumesnil.net
                    </a>
                </li>
            </ul>
        </nav>
    </footer>
);

export default Footer;
