import React, { useState } from 'react';
import heroes from '../../heroes.json'; // Adjust the path to where your JSON file is located
import styles from "./HeroSelect.module.css";

interface HeroSelectProps {
    handleHeroSelect: (searchQuery: string) => void;
}

const HeroSelect: React.FC<HeroSelectProps> = ({handleHeroSelect}) => {
    // Future implementation for the onClick handler
    const handleClick = (setid: string) => {
        handleHeroSelect(`input=(si:"${setid}")`);
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
