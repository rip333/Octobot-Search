// pages/search.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Card } from '@/models/Card';
import Results from '@/components/results/Results';
import Header from '@/components/header/Header';
import axios from "axios";

const Search: React.FC = () => {
    const router = useRouter();
    const [searchResults, setSearchResults] = useState<Card[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            
            if (router.query.query) {
                try {
                    let results = await axios.get(`https://cerebro-beta-bot.herokuapp.com/query?${router.query.query as string}`);
                    setSearchResults(results?.data);
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
            <Header />
            <Results results={searchResults} loading={loading} />
        </div>
    );
}

export default Search;
