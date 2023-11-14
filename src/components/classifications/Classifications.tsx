import React from 'react';
import styles from "./Classifications.module.css";
import { useRouter } from 'next/router'; // Import useRouter

const c12ns = [
{name: "Aggression", color: "red"},
{name: "Justice", color: "yellow"},
{name: "Leadership", color: "blue"},
{name: "Protection", color: "green"},
{name: "Basic", color: "grey"},
{name: "Hero", color: "white"},
{name: "Encounter", color: "purple"}
]

const Classifications: React.FC = () => {
    const router = useRouter(); // Initialize useRouter

    const handleClick = (Id: string) => {
        router.push(`/cards/cl/${Id}`);
    };

    return (
        <div className={styles.classifications}>
            <h3>Classifications</h3>
            {c12ns.map(cl => (
                <button className={styles.classificationsButton} key={cl.name} onClick={() => handleClick(cl.name)}>
                    {cl.name}
                </button>
            ))}
        </div>
    );
};

export default Classifications;