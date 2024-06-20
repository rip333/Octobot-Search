import React from 'react';
import Header from "@/components/header/Header";
import axios from "axios";
import CardSets from "@/components/card-sets/CardSets";
import CardPacks from "@/components/card-packs/CardPacks";
import Classifications from "@/components/classifications/Classifications";
import Footer from "@/components/footer/Footer";
import { CardSet } from "../models/CardSet";
import { CardPack } from "../models/CardPack";
import CardTypes from '@/components/card-types/CardTypes';

// Fetcher function to fetch data from API
const fetcher = async (url: string) => {
  const res = await axios.get(url);
  return res.data;
};

const Home: React.FC<{ sets: CardSet[], packs: CardPack[], setsError: boolean, packsError: boolean }> = ({ sets, packs, setsError, packsError }) => {
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
            <CardTypes />
          </>
        )}
        <Footer />
      </div>
    </div>
  );
};

export async function getStaticProps() {
  try {
    const [sets, packs] = await Promise.all([
      fetcher('https://cerebro-beta-bot.herokuapp.com/sets?official=true'),
      fetcher('https://cerebro-beta-bot.herokuapp.com/packs?official=true')
    ]);

    return {
      props: {
        sets,
        packs,
        setsError: false,
        packsError: false,
      },
      revalidate: 604800,
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {
        sets: [],
        packs: [],
        setsError: true,
        packsError: true,
      },
      revalidate: 604800,
    };
  }
}


export default Home;
