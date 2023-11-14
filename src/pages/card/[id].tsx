import Header from "@/components/header/Header";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from "axios";
import { Card } from "@/models/Card";
import CardDisplay from "@/components/card-display/CardDisplay";
import Footer from "@/components/footer/Footer";

const Page: React.FC = () => {

    const router = useRouter();
    const [card, setCard] = useState<Card>();
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!router.isReady) return;
            setLoading(true);
            try {
                let results = await axios.get(`https://cerebro-beta-bot.herokuapp.com/query?input=(id:"${router.query.id}"%26o:"true")`);
                setCard(results?.data[0]);
            } catch (error) {
                console.error('Error fetching sets:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [router.query]);

    if (card) {
        return (
            <div>
                <Header />
                <CardDisplay card={card} />
                <Footer />
            </div>
        );
    }

    return (<div>Loading...</div>)
}

export default Page;