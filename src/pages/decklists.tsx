import React from 'react';
import Header from "@/components/header/Header";
import axios from "axios";
import Footer from "@/components/footer/Footer";
import { CardSet } from "@/models/CardSet";
import CardSets from "@/components/card-sets/CardSets";
import SearchBar from '@/components/search-bar/SearchBar';

const fetcher = async (url: string) => {
    const res = await axios.get(url);
    return res.data;
};

const Decklists: React.FC<{
    decklists: CardSet[],
    error: boolean
}> = ({ decklists, error }) => {
    if (error) {
        console.error('Error fetching decklists');
        return <div>Failed to load decklists</div>;
    }

    return (
        <div style={{ textAlign: "center" }}>
            <Header miniLogo={false} />
            <SearchBar />
            <div style={{ width: "90%", display: "inline-block" }}>
                <h2>POPULAR DECKLISTS</h2>
                <CardSets cardSets={decklists} baseLink="/cards/dl/" />
            </div>
            <Footer />
        </div>
    );
};

export async function getStaticProps() {
    try {
        const rawDecklists = await fetcher('https://marvelcdb.com/api/public/decklists/popular/');

        // Map MarvelCDB decklists to CardSet interface
        const decklists: CardSet[] = rawDecklists.map((item: any) => {
            const dl = item.decklist || item;
            return {
                Id: dl.id ? dl.id.toString() : '',
                Name: dl.name || 'Unknown',
                Type: dl.hero_name || 'Unknown', // Group by Hero Name
                Official: true,
                Deleted: false,
                CanSimulate: false,
                Deviation: false,
                Modulars: 0,
                PackId: '',
            };
        });

        return {
            props: {
                decklists,
                error: false,
            },
            revalidate: 3600, // Revalidate every hour
        };
    } catch (error) {
        console.error('Error fetching decklists:', error);
        return {
            props: {
                decklists: [],
                error: true,
            },
            revalidate: 3600,
        };
    }
}

export default Decklists;
