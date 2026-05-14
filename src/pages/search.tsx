// pages/search.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card } from '@/models/Card';
import Results from '@/components/results/Results';
import Header from '@/components/header/Header';
import axios from "axios";
import { createSearchQuery } from '@/searchUtils';
import NoResults from '@/components/no-results/NoResults';
import Loading from '@/components/loading/Loading';
import Footer from '@/components/footer/Footer';
import SearchBar from '@/components/search-bar/SearchBar';

const Search: React.FC = () => {
    const router = useRouter();
    const [searchResults, setSearchResults] = useState<Card[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [cerebroQuery, setCerebroQuery] = useState<string>('');
    const [isFallback, setIsFallback] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setIsFallback(false);

            if (router.query.query) {
                try {
                    let searchQueryAnd = createSearchQuery(router.query.query as string, { origin: 'official' }, '%26');
                    setCerebroQuery(searchQueryAnd);
                    let results = await axios.get(`https://cerebro-beta-bot.herokuapp.com/query?${searchQueryAnd}`);
                    
                    if (results?.data && Array.isArray(results.data) && results.data.length > 0) {
                        setSearchResults(results.data.reverse());
                        setLoading(false);
                        return;
                    }
                } catch (error) {
                    console.log('AND query failed or returned no results, falling back to OR query');
                }

                // Fallback to OR query if AND query returns 0 results or throws error (like 404)
                try {
                    let searchQueryOr = createSearchQuery(router.query.query as string, { origin: 'official' }, '|');
                    setCerebroQuery(searchQueryOr);
                    let fallbackResults = await axios.get(`https://cerebro-beta-bot.herokuapp.com/query?${searchQueryOr}`);
                    setSearchResults(fallbackResults?.data && Array.isArray(fallbackResults.data) ? fallbackResults.data.reverse() : []);
                    setIsFallback(true);
                } catch (error) {
                    console.error('Error fetching fallback search results:', error);
                    setSearchResults([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchData();
    }, [router.query.query]);

    return (
        <div>
            <Header miniLogo={true} />
            <SearchBar />
            {loading && <Loading />}
            {!loading && isFallback && searchResults.length > 0 && (
                <div className="flex justify-center mt-4 mb-2 px-4">
                    <p className="text-yellow-400 bg-gray-800/80 px-4 py-2 rounded-lg text-sm font-medium border border-yellow-500/30">
                        No exact matches found. Showing partial matches instead.
                    </p>
                </div>
            )}
            {!loading && <Results results={searchResults} cerebroQuery={cerebroQuery} detailsEnabled={true} />}
            {searchResults.length === 0 && !loading && <NoResults />}
            <Footer />
        </div>
    );
}

export default Search;
