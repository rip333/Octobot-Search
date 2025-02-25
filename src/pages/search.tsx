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

const Search: React.FC = () => {
    const router = useRouter();
    const [searchResults, setSearchResults] = useState<Card[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            if (router.query.query) {
                try {
                    let searchQuery = createSearchQuery(router.query.query as string, { origin: router.query.origin as string })
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
            {loading && <Loading />}
            {!loading && <Results results={searchResults} />}
            {searchResults.length === 0 && !loading && <NoResults/>}
        </div>
    );
}

export default Search;
