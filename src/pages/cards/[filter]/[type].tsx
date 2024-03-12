import { useRouter } from 'next/router';
import useSWR from 'swr';
import axios from "axios";
import { Card } from "@/models/Card";
import Results from "@/components/results/Results";
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

const Page: React.FC = () => {
    const router = useRouter();

    const queryURL = router.isReady ? `https://cerebro-beta-bot.herokuapp.com/query?input=(${router.query.filter}:"${router.query.type}")&origin:"official"` : null;

    // Use SWR for data fetching
    const { data: cards, error, isValidating } = useSWR<Card[]>(queryURL, fetcher, {
        revalidateOnFocus: false, 
    });

    const loading = !cards && isValidating;

    if (error) {
        console.error('Error fetching cards:', error);
    }

    return (
        <div>
            <Header miniLogo={true} />
            <Results results={cards || []} loading={loading} />
            <Footer />
        </div>
    );
};

export default Page;