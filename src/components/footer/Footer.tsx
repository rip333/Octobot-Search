// Footer.jsx
import React from 'react';
import styles from './Footer.module.css'; // Import the CSS Module

const Footer: React.FC = () => {
    return (
        <footer className={styles.footer}>
            <ul className={styles.links}>
                <li className={styles.linkItem}>
                    <a href="https://github.com/rip333/Octobot-Search-Ui" className={styles.link}>
                        Github
                    </a>
                </li>
                <li className={styles.linkItem}>
                    Powered by: <a href="https://github.com/UnicornSnuggler/Cerebro" className={styles.link}>
                        Cerebro
                    </a>
                </li>
            </ul>
        </footer>
    );
};

export default Footer;
