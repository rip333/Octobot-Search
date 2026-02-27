import React from 'react';
import CardSets from "@/components/card-sets/CardSets";
import CardPacks from "@/components/card-packs/CardPacks";
import UnofficialCardSets from "@/components/card-sets/UnofficialCardSets";
import Classifications from "@/components/classifications/Classifications";
import CardTypes from '@/components/card-types/CardTypes';
import { CardSet } from "@/models/CardSet";
import { CardPack } from "@/models/CardPack";
import { MerlinPack } from '@/models/MerlinPack';
import { useRouter } from 'next/router';
import Link from 'next/link';
import sharedStyles from "../../styles/Shared.module.css";
import styles from './Browse.module.css';

interface BrowseProps {
    isUnofficial: boolean;
    sets: CardSet[];
    packs: CardPack[];
    unofficialSets: CardSet[];
    merlinPacks: MerlinPack[];
    loading: boolean;
}

const Browse: React.FC<BrowseProps> = ({
    isUnofficial,
    sets,
    packs,
    unofficialSets,
    merlinPacks,
    loading
}) => {
    const router = useRouter();
    const origin = isUnofficial ? 'unofficial' : 'official';

    const handleOriginChange = (newOrigin: string) => {
        const { query } = router;
        if (newOrigin === 'official') {
            const { origin: _origin, ...rest } = query;
            router.push({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
        } else {
            router.push({ pathname: router.pathname, query: { ...query, origin: newOrigin } }, undefined, { shallow: true });
        }
    };

    return (
        <div style={{ width: "90%", display: "inline-block" }}>
            <h2>BROWSE CARDS</h2>
            <div className={styles.toggleLayout}>
                <div className={styles.sourceToggle} role="group" aria-label="Card source">
                    <button
                        type="button"
                        aria-pressed={origin === 'official'}
                        onClick={() => handleOriginChange('official')}
                    >
                        ✔︎ Official
                    </button>
                    <button
                        type="button"
                        aria-pressed={origin === 'unofficial'}
                        onClick={() => handleOriginChange('unofficial')}
                    >
                        ✦ Unofficial
                    </button>
                </div>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : (
                <>
                    {isUnofficial ? (
                        <UnofficialCardSets unofficialCerebroSets={unofficialSets} merlinPacks={merlinPacks} />
                    ) : (
                        <>
                            <CardSets cardSets={sets} />
                            <CardPacks cardPacks={packs} />
                        </>
                    )}
                    {!isUnofficial && (
                        <>
                            <Classifications />
                            <CardTypes />
                            <div className={sharedStyles.sectionContainer}>
                                <h3>Community</h3>
                                <div className={sharedStyles.buttonGrid}>
                                    <Link href="/decklists" passHref className={sharedStyles.redButton} role="button">
                                        Popular Decklists
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )
            } </div>
    );
};

export default Browse;
