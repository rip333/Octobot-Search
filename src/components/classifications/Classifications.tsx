import React from 'react';
import styles from "./Classifications.module.css";
import sharedStyles from "../../styles/Shared.module.css";
import Link from 'next/link'; // Import Link

const c12ns = [
    { name: "Aggression", color: "red" },
    { name: "Justice", color: "yellow" },
    { name: "Leadership", color: "blue" },
    { name: "Protection", color: "green" },
    { name: "Pool", color: "pink" },
    { name: "Basic", color: "grey" },
    { name: "Hero", color: "white" },
    { name: "Encounter", color: "purple" }
]

const Classifications: React.FC = () => {
    return (
        <div className={sharedStyles.sectionContainer}>
            <h3>Classifications</h3>
            <div className={sharedStyles.buttonGrid}>
                {c12ns.map(cl => (
                    <Link href={`/cards/cl/${cl.name}`} key={cl.name} passHref className={sharedStyles.redButton} style={{ borderColor: cl.color, borderStyle: 'solid' }}>
                        {cl.name}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Classifications;