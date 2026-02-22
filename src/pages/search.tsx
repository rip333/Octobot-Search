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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            if (router.query.query) {
                try {
                    let searchQuery = createSearchQuery(router.query.query as string, { origin: 'official' })
                    setCerebroQuery(searchQuery);
                    let results = await axios.get(`https://cerebro-beta-bot.herokuapp.com/query?${searchQuery}`);
                    setSearchResults(results?.data.reverse());
                    setLoading(false);
                } catch (error) {
                    console.error('Error fetching search results:', error);
                }
                finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [router.query.query]);

    return (
        <div>
            <Header miniLogo={true} />
            <SearchBar />
            {loading && <Loading />}
            {!loading && <Results results={searchResults} cerebroQuery={cerebroQuery} detailsEnabled={router.query.origin !== 'ms' && router.query.origin !== 'usi'} />}
            {searchResults.length === 0 && !loading && <NoResults />}
            <Footer />
        </div>
    );
}

export default Search;
