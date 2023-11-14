import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from "axios";
import { Card } from "@/models/Card";
import Results from "@/components/results/Results";
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';

const Page: React.FC = () => {

    const router = useRouter();
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!router.isReady) return;
            setLoading(true);
            try {
                let results = await axios.get(`https://cerebro-beta-bot.herokuapp.com/query?input=(${router.query.filter}:"${router.query.type}")&origin:"official"`);
                setCards(results?.data);
            } catch (error) {
                console.error('Error fetching sets:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [router.query]);


    return (
        <div>
            <Header />
            <Results results={cards} loading={loading} />
            <Footer />
        </div>
    );
}

export default Page;
