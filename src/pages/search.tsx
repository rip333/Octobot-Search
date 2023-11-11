// pages/search.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { queryCerebro } from "../cerebro-api"; // Axios call
import { Card } from '@/models/Card';
import Results from '@/components/results/Results';
import Header from '@/components/header/Header';

const Search: React.FC = () => {
    const router = useRouter();
    const [searchResults, setSearchResults] = useState<Card[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (router.query.query) {
                const results = await queryCerebro(router.query.query as string);
                setSearchResults(results?.data);
            }
        };

        fetchData();
    }, [router.query.query]);

    return (
        <div>
            <Header />
            <Results results={searchResults} />
        </div>
    );
}

export default Search;
