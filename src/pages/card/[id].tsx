import React from 'react';
import Header from "@/components/header/Header";
import { useRouter } from 'next/router';
import useSWR from 'swr';
import axios from "axios";
import { Card } from "@/models/Card";
import CardDisplay from "@/components/card-display/CardDisplay";
import Footer from "@/components/footer/Footer";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

const Page: React.FC = () => {
    const router = useRouter();

    // Construct the URL based on the router's query parameters
    const queryURL = router.isReady ? `https://cerebro-beta-bot.herokuapp.com/query?input=(id:"${router.query.id}"%26o:"true")` : null;

    // Use SWR for data fetching
    const { data, error } = useSWR<Card[]>(queryURL, fetcher, {
        revalidateOnFocus: false, // Optionally, disable or enable automatic revalidation when window gains focus
    });

    // Select the first card from the data array if data is available
    const card = data ? data[0] : undefined;

    // Render loading state if data is not yet available or an error occurred
    if (error) {
        console.error('Error fetching card:', error);
        return <div>Error loading the card.</div>; // Adjust error handling as needed
    }

    if (!card) {
        return (
            <div>
                <Header miniLogo={true} />
                <div>Loading...</div>
                <Footer />
            </div>
        );
    }

    return (
        <div>
            <Header miniLogo={true} />
            <CardDisplay card={card} />
            <Footer />
        </div>
    );
};

export default Page;
