import React, { useState } from 'react';
import heroes from '../../heroes.json'; // Adjust the path to where your JSON file is located
import styles from "./HeroSelect.module.css";
import { useRouter } from 'next/router'; // Import useRouter

const HeroSelect: React.FC = () => {
    const router = useRouter(); // Initialize useRouter

    const handleClick = (setid: string) => {
        router.push(`/search?query=input=(si:"${setid}")`);
    };

    return (
        <div className={styles.heroButtonDiv}>
            {heroes.map(hero => (
                <button className={styles.heroButton} key={hero.setid} onClick={() => handleClick(hero.setid)}>
                    {hero.name}
                </button>
            ))}
        </div>
    );
};

export default HeroSelect;
