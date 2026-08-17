// pages/search.tsx
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/models/Card';
import Results from '@/components/results/Results';
import Header from '@/components/header/Header';
import { createSearchQuery } from '@/searchUtils';
import NoResults from '@/components/no-results/NoResults';
import Loading from '@/components/loading/Loading';
import Footer from '@/components/footer/Footer';
import PageMeta from '@/components/page-meta/PageMeta';
import SearchBar from '@/components/search-bar/SearchBar';
import { fetchCerebroCards } from '@/api/cerebro';
import { isUpstreamFailure } from '@/api/result';

type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface SearchState {
    status: SearchStatus;
    results: Card[];
    cerebroQuery: string;
    isFallback: boolean;
    errorMessage?: string;
}

const INITIAL_SEARCH_STATE: SearchState = {
    status: 'idle',
    results: [],
    cerebroQuery: '',
    isFallback: false,
};

const FAILURE_STATE: SearchState = {
    status: 'error',
    results: [],
    cerebroQuery: '',
    isFallback: false,
    errorMessage: 'Search is temporarily unavailable. Please try again.',
};

const Search: React.FC = () => {
    const router = useRouter();
    const [searchState, setSearchState] = useState<SearchState>(INITIAL_SEARCH_STATE);
    const [retryCount, setRetryCount] = useState(0);
    const activeRequestId = useRef(0);
    const searchText = typeof router.query.query === 'string' ? router.query.query.trim() : '';

    useEffect(() => {
        if (!router.isReady) return;

        const abortController = new AbortController();
        const requestId = ++activeRequestId.current;
        const requestIsActive = () =>
            !abortController.signal.aborted && activeRequestId.current === requestId;

        const runSearch = async () => {
            if (!searchText) {
                if (requestIsActive()) setSearchState(INITIAL_SEARCH_STATE);
                return;
            }

            setSearchState({
                status: 'loading',
                results: [],
                cerebroQuery: '',
                isFallback: false,
            });

            try {
                const exactQuery = createSearchQuery(searchText, 'and');
                const exactResult = await fetchCerebroCards(exactQuery, abortController.signal);
                if (!requestIsActive()) return;

                if (isUpstreamFailure(exactResult)) {
                    console.error(`Cerebro search failed (${exactResult.reason}).`);
                    setSearchState(FAILURE_STATE);
                    return;
                }

                if (exactResult.status === 'success') {
                    setSearchState({
                        status: 'success',
                        results: [...exactResult.data].reverse(),
                        cerebroQuery: exactQuery,
                        isFallback: false,
                    });
                    return;
                }

                // Exact match found nothing; widen to a partial match.
                const fallbackQuery = createSearchQuery(searchText, 'or');
                const fallbackResult = await fetchCerebroCards(fallbackQuery, abortController.signal);
                if (!requestIsActive()) return;

                if (isUpstreamFailure(fallbackResult)) {
                    console.error(`Cerebro fallback search failed (${fallbackResult.reason}).`);
                    setSearchState(FAILURE_STATE);
                    return;
                }

                const found = fallbackResult.status === 'success' ? fallbackResult.data : [];
                setSearchState({
                    status: found.length > 0 ? 'success' : 'empty',
                    results: [...found].reverse(),
                    cerebroQuery: fallbackQuery,
                    isFallback: found.length > 0,
                });
            } catch (error) {
                // Only aborts reach here; every upstream problem is a typed result.
                if (!requestIsActive()) return;

                const errorSummary = error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error';
                console.error(`Cerebro search request failed (${errorSummary}).`);
                setSearchState(FAILURE_STATE);
            }
        };

        void runSearch();
        return () => {
            abortController.abort();
            if (activeRequestId.current === requestId) activeRequestId.current += 1;
        };
    }, [router.isReady, retryCount, searchText]);

    const { status, results, cerebroQuery, isFallback, errorMessage } = searchState;

    return (
        <div>
            <PageMeta
                title={searchText ? `Search: ${searchText}` : 'Search'}
                description="Search official Marvel Champions cards by name, rules text, or trait."
                noIndex
            />
            <Header miniLogo={true} />
            <SearchBar />
            <main>
                {status === 'idle' && (
                    <p className="text-center px-4 py-8 text-white">
                        Enter a card name, rules text, or trait to search.
                    </p>
                )}
                {status === 'loading' && <Loading />}
                {status === 'success' && isFallback && (
                    <div className="flex justify-center mt-4 mb-2 px-4">
                        <p role="status" className="text-yellow-400 bg-gray-800/80 px-4 py-2 rounded-lg text-sm font-medium border border-yellow-500/30">
                            No exact matches found. Showing partial matches instead.
                        </p>
                    </div>
                )}
                {status === 'success' && (
                    <Results results={results} cerebroQuery={cerebroQuery} detailsEnabled={true} />
                )}
                {status === 'empty' && <NoResults />}
                {status === 'error' && (
                    <div role="alert" className="flex flex-col items-center gap-3 px-4 py-8 text-white">
                        <p>{errorMessage}</p>
                        <button type="button" onClick={() => setRetryCount(count => count + 1)}>Try again</button>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default Search;
