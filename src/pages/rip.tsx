import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/footer/Footer';
import PageMeta from '@/components/page-meta/PageMeta';
import styles from '@/styles/Profile.module.css';
import textLogo from "../icon-text.webp";

const MERLIN_IMAGE_ORIGIN = 'https://mc4db.merlindumesnil.net';

/**
 * Sets published on Merlin. Image paths follow Merlin's
 * `/bundles/cards/EN/<pack>/<card>.webp` layout; the older flat
 * `/bundles/cards/<card>.png` paths are gone.
 */
const RIPPER3_SETS = [
    { pack: 'alligator_loki_by_ripper3', card: '202801b', label: 'Alligator Loki' },
    { pack: 'beta_ray_bill_by_ripper3', card: '202701b', label: 'Beta Ray Bill' },
    { pack: 'rachel_summers_by_ripper3', card: '205701a', label: 'Rachel Summers' },
    { pack: 'nightwing_by_ripper3', card: '206501a', label: 'Nightwing' },
    { pack: 'web_of_deceit_by_ripper3', card: '203501b', label: 'Web of Deceit (Campaign)' },
] as const;

const Rip: React.FC = () => {
    return (
        <div className={styles.profileContainer}>
            <PageMeta
                title="Rip Britton"
                description="Marvel Champions custom sets and projects by Rip Britton."
            />
            <header className={styles.heroSection}>
                <h1 className={styles.heroName}>Rip Britton</h1>
                <p className={styles.heroRole}>Champion Developer</p>
            </header>

            <main>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Links</h2>
                    <ul className={styles.grid}>
                        <li>
                            <Link href="/" className={styles.card}>
                                <Image
                                    style={{ width: '50%', height: 'auto', marginLeft: '-10px' }}
                                    src={textLogo}
                                    alt="Octobot Search"
                                />
                                <span className={styles.cardDesc}>My Marvel Champions Search Engine Website.</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="https://marvelcdb.com/user/profile/21062/ripb3"
                                className={styles.card}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span className={styles.cardTitle}>✔︎ MarvelCDB Profile</span>
                                <span className={styles.cardDesc}>Official decklists.</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="https://github.com/rip333/"
                                className={styles.card}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span className={styles.cardTitle}>✔︎ GitHub Profile</span>
                                <span className={styles.cardDesc}>My hobby development projects.</span>
                            </Link>
                        </li>
                        {/* Creator Drive Libraries are disabled pending the security work in TODO.md. */}
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Ripper3 Sets</h2>
                    <ul className={styles.projectGrid}>
                        {RIPPER3_SETS.map(set => (
                            <li key={set.pack}>
                                <Link href={`/cards/ms/${set.pack}`} className={styles.projectCard}>
                                    <Image
                                        src={`${MERLIN_IMAGE_ORIGIN}/bundles/cards/EN/${set.pack}/${set.card}.webp`}
                                        alt={set.label}
                                        width={365}
                                        height={515}
                                        sizes="(max-width: 768px) 45vw, 365px"
                                        className={styles.projectImage}
                                    />
                                    <span className={styles.projectLabel}>{set.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Rip;
