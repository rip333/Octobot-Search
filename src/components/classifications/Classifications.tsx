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
        router.push(`/cl/${Id}`);
    };

    return (
        <div className={styles.classifications}>
            {c12ns.map(cl => (
                <button className={styles.classificationsButton} style={{ backgroundColor: cl.color }} key={cl.name} onClick={() => handleClick(cl.name)}>
                    {cl.name}
                </button>
            ))}
        </div>
    );
};

export default Classifications;