import Header from "@/components/header/Header";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from "axios";
import { Card } from "@/models/Card";
import Results from "@/components/results/Results";

// pages/index.tsx
const Set: React.FC = () => {

    const router = useRouter();
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                let results = await axios.get(`https://cerebro-beta-bot.herokuapp.com/query?input=(si:"${router.query.setId}")`);
                setCards(results?.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching sets:', error);
            }
            finally {
                setLoading(false);
            }

        };

        fetchData();
    }, []);


    return (
        <div>
            <Header />
            <Results results={cards} loading={loading} />
        </div>
    );
}

export default Set;
