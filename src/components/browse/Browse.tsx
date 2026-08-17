import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import CardSets from "@/components/card-sets/CardSets";
import CardPacks from "@/components/card-packs/CardPacks";
import UnofficialCardSets from "@/components/card-sets/UnofficialCardSets";
import Classifications from "@/components/classifications/Classifications";
import CardTypes from '@/components/card-types/CardTypes';
import Loading from '@/components/loading/Loading';
import { CardSet, UnofficialCardSet } from "@/models/CardSet";
import { CardPack } from "@/models/CardPack";
import type { UnofficialBrowseResponse } from '@/pages/api/browse/unofficial';
import styles from './Browse.module.css';

import { CheckCircle, Warning } from "@phosphor-icons/react";

interface BrowseProps {
    isUnofficial: boolean;
    sets: CardSet[];
    packs: CardPack[];
    setsUnavailable: boolean;
    packsUnavailable: boolean;
}

interface UnofficialState {
    /** `idle` doubles as "request in flight": the fetch is started by the effect below. */
    status: 'idle' | 'ready' | 'error';
    sets: UnofficialCardSet[];
    partial: boolean;
}

const IDLE_UNOFFICIAL: UnofficialState = { status: 'idle', sets: [], partial: false };

const UnavailableNotice: React.FC<{ label: string }> = ({ label }) => (
    <p role="status" className={styles.unavailable}>
        {label} could not be loaded right now. The rest of this page is unaffected.
    </p>
);

const Browse: React.FC<BrowseProps> = ({
    isUnofficial,
    sets,
    packs,
    setsUnavailable,
    packsUnavailable,
}) => {
    const router = useRouter();
    const origin = isUnofficial ? 'unofficial' : 'official';

    const [unofficial, setUnofficial] = useState<UnofficialState>(IDLE_UNOFFICIAL);
    const [retryCount, setRetryCount] = useState(0);
    const hasRequested = useRef(false);

    // Community sets are only fetched once the unofficial view is actually opened.
    useEffect(() => {
        if (!isUnofficial || hasRequested.current) return;

        hasRequested.current = true;
        const abortController = new AbortController();

        fetch('/api/browse/unofficial', { signal: abortController.signal })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json() as Promise<UnofficialBrowseResponse>;
            })
            .then(data => setUnofficial({ status: 'ready', sets: data.sets, partial: data.partial }))
            .catch((error: unknown) => {
                // A toggle back to official aborts the request; allow a later retry.
                if (error instanceof Error && error.name === 'AbortError') {
                    hasRequested.current = false;
                    return;
                }
                setUnofficial({ status: 'error', sets: [], partial: false });
            });

        return () => abortController.abort();
    }, [isUnofficial, retryCount]);

    const retryUnofficial = useCallback(() => {
        hasRequested.current = false;
        setUnofficial(IDLE_UNOFFICIAL);
        setRetryCount(count => count + 1);
    }, []);

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
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <CheckCircle size={18} weight="fill" aria-hidden="true" /> Official
                    </button>
                    <button
                        type="button"
                        aria-pressed={origin === 'unofficial'}
                        onClick={() => handleOriginChange('unofficial')}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Warning size={18} weight="fill" aria-hidden="true" /> Unofficial
                    </button>
                </div>
            </div>

            {isUnofficial ? (
                <>
                    {unofficial.status === 'idle' && <Loading />}
                    {unofficial.status === 'ready' && (
                        <>
                            {unofficial.partial && <UnavailableNotice label="Some community sources" />}
                            <UnofficialCardSets sets={unofficial.sets} />
                        </>
                    )}
                    {unofficial.status === 'error' && (
                        <div role="alert" className={styles.unavailable}>
                            <p>Community card sets are temporarily unavailable.</p>
                            <button type="button" onClick={retryUnofficial}>Try again</button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    {setsUnavailable ? <UnavailableNotice label="Card sets" /> : <CardSets cardSets={sets} />}
                    {packsUnavailable ? <UnavailableNotice label="Card packs" /> : <CardPacks cardPacks={packs} />}
                    <Classifications />
                    <CardTypes />
                </>
            )}
        </div>
    );
};

export default Browse;
