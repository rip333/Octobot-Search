import React from 'react';
import Header from "@/components/header/Header";
import HeroSelect from "@/components/hero-select/HeroSelect";
import useSWR from 'swr';
import axios from "axios";
import CardSets from "@/components/card-sets/CardSets";
import CardPacks from "@/components/card-packs/CardPacks";
import Classifications from "@/components/classifications/Classifications";
import Footer from "@/components/footer/Footer";
import { CardSet } from "../models/CardSet";
import { CardPack } from "../models/CardPack";

// Axios fetcher function
const fetcher = (url: string) => axios.get(url).then(res => res.data);

const Home: React.FC = () => {
  // SWR hook to fetch card sets
  const { data: sets, error: setsError } = useSWR<CardSet[]>(`https://cerebro-beta-bot.herokuapp.com/sets?official=true`, fetcher);

  // SWR hook to fetch card packs
  const { data: packs, error: packsError } = useSWR<CardPack[]>(`https://cerebro-beta-bot.herokuapp.com/packs?official=true`, fetcher);

  // Loading state
  const loading = !sets || !packs;

  // Error handling
  if (setsError || packsError) {
    console.error('Error fetching data:', setsError || packsError);
    return <div>Failed to load data</div>;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <Header miniLogo={false} />
      <div style={{ width: "90%", display: "inline-block" }}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <CardSets cardSets={sets} />
            <CardPacks cardPacks={packs} />
            <Classifications />
          </>
        )}
        <Footer />
      </div>
    </div>
  );
};

export default Home;
