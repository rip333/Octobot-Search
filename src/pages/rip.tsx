import React from 'react';
import Link from 'next/link';
import Footer from '@/components/footer/Footer';
import styles from '@/styles/Profile.module.css';
import textLogo from "../icon-text.png";
import Image from 'next/image';

const Rip: React.FC = () => {
    return (
        <div className={styles.profileContainer}>
            <section className={styles.heroSection}>
                <h1 className={styles.heroName}>Rip Britton</h1>
                <div className={styles.heroRole}>Champion Developer</div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Links</h2>
                <div className={styles.grid}>
                    <Link
                        href="/"
                        className={styles.card}
                    >
                        <div>
                            <Image style={{ width: '50%', height: 'auto', marginLeft: '-10px' }} src={textLogo} alt="logo" />
                            <div className={styles.cardDesc}>My Marvel Champions Search Engine Website.</div>
                        </div>
                    </Link>
                    <Link
                        href="https://marvelcdb.com/user/profile/21062/ripb3"
                        className={styles.card}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <div>
                            <div className={styles.cardTitle}>✔︎ MarvelCDB Profile</div>
                            <div className={styles.cardDesc}>Official decklists.</div>
                        </div>
                    </Link>
                    <Link
                        href="https://github.com/rip333/"
                        className={styles.card}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <div>
                            <div className={styles.cardTitle}>✔︎ GitHub Profile</div>
                            <div className={styles.cardDesc}>My hobby development projects.</div>
                        </div>
                    </Link>
                    <Link
                        href="https://drive.google.com/drive/folders/17cwUOAMOBPP1taTyVarPUKLGWOAoZK68"
                        className={styles.card}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <div>
                            <div className={styles.cardTitle}>✦ Google Drive</div>
                            <div className={styles.cardDesc}>Contains my homebrew content, alters, photoshop templates, scripts, and more.</div>
                        </div>
                    </Link>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Ripper3 Sets</h2>
                <div className={styles.projectGrid}>
                    <Link href="/cards/ms/alligator_loki_by_ripper3" className={styles.projectCard}>
                        <img
                            src="https://db.merlindumesnil.net/bundles/cards/202801a.png"
                            alt="Alligator Loki"
                            className={styles.projectImage}
                        />
                        <div className={styles.projectLabel}>Alligator Loki</div>
                    </Link>
                    <Link href="/cards/ms/beta_ray_bill_by_ripper3" className={styles.projectCard}>
                        <img
                            src="https://db.merlindumesnil.net/bundles/cards/202701a.png"
                            alt="Beta Ray Bill"
                            className={styles.projectImage}
                        />
                        <div className={styles.projectLabel}>Beta Ray Bill</div>
                    </Link>
                    <Link href="/cards/ms/scarlet_spider_by_ripper3" className={styles.projectCard}>
                        <img
                            src="https://db.merlindumesnil.net/bundles/cards/203501a.png"
                            alt="Scarlet Spider (Kaine)"
                            className={styles.projectImage}
                        />
                        <div className={styles.projectLabel}>Scarlet Spider (Kaine)</div>
                    </Link>
                    <Link href="/cards/ms/superior_spider-man_by_ripper3" className={styles.projectCard}>
                        <img
                            src="https://db.merlindumesnil.net/bundles/cards/203401a.png"
                            alt="Superior Spider-Man (Otto Octavius)"
                            className={styles.projectImage}
                        />
                        <div className={styles.projectLabel}>Superior Spider-Man (Otto Octavius)</div>
                    </Link>
                    <Link href="/cards/ms/venom_by_ripper3" className={styles.projectCard}>
                        <img
                            src="https://db.merlindumesnil.net/bundles/cards/203301a.png"
                            alt="Venom (Eddie Brock)"
                            className={styles.projectImage}
                        />
                        <div className={styles.projectLabel}>Venom (Eddie Brock)</div>
                    </Link>
                    <Link href="/cards/ms/rachel_summers_by_ripper3" className={styles.projectCard}>
                        <img
                            src="https://db.merlindumesnil.net/bundles/cards/205701a.png"
                            alt="Rachel Summers"
                            className={styles.projectImage}
                        />
                        <div className={styles.projectLabel}>Rachel Summers</div>
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Rip;
