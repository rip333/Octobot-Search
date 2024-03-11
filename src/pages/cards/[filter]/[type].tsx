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

    // Construct the URL based on the router's query parameters
    const queryURL = router.isReady ? `https://cerebro-beta-bot.herokuapp.com/query?input=(${router.query.filter}:"${router.query.type}")&origin:"official"` : null;

    // Use SWR for data fetching
    const { data: cards, error, isValidating } = useSWR<Card[]>(queryURL, fetcher, {
        revalidateOnFocus: false, // Optionally, disable or enable automatic revalidation when window gains focus
    });

    // Handle loading state
    const loading = !cards && isValidating;

    // Optional: Error handling
    if (error) {
        console.error('Error fetching cards:', error);
        // Return or render an error state as needed
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