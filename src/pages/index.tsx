import React from 'react';
import Header from "@/components/header/Header";
import axios from "axios";
import CardSets from "@/components/card-sets/CardSets";
import CardPacks from "@/components/card-packs/CardPacks";
import UnofficialCardSets from "@/components/card-sets/UnofficialCardSets";
import Classifications from "@/components/classifications/Classifications";
import Footer from "@/components/footer/Footer";
import { CardSet } from "../models/CardSet";
import { CardPack } from "../models/CardPack";
import { MerlinPack } from '@/models/MerlinPack';
import CardTypes from '@/components/card-types/CardTypes';
import { useRouter } from 'next/router';

// Fetcher function to fetch data from API
const fetcher = async (url: string) => {
  const res = await axios.get(url);
  return res.data;
};

const Home: React.FC<{
  sets: CardSet[],
  packs: CardPack[],
  unofficialSets: CardSet[],
  merlinPacks: MerlinPack[],
  setsError: boolean,
  packsError: boolean,
  serverOrigin?: string
}> = ({ sets, packs, unofficialSets, merlinPacks, setsError, packsError, serverOrigin }) => {
  const router = useRouter();
  const { origin: clientOrigin } = router.query;
  const origin = clientOrigin || serverOrigin || 'official';
  const isUnofficial = origin === 'unofficial';

  // Loading state (SSR ensures data is present)
  const loading = false;

  // Error handling
  if (setsError || packsError) {
    console.error('Error fetching data:', setsError || packsError);
    return <div>Failed to load data</div>;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <Header miniLogo={false} origin={origin as string} />
      <div style={{ width: "90%", display: "inline-block" }}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {isUnofficial ? (
              <UnofficialCardSets unofficialCerebroSets={unofficialSets} merlinPacks={merlinPacks} />
            ) : (
              <>
                <CardSets cardSets={sets} />
                <CardPacks cardPacks={packs} />
              </>
            )}
            {!isUnofficial && (
              <>
                <Classifications />
                <CardTypes />
              </>
            )}
          </>
        )}
        <Footer />
      </div>
    </div>
  );
};

export async function getStaticProps() {
  try {
    const [sets, packs, cerebroSets, merlinPacksData] = await Promise.all([
      fetcher('https://cerebro-beta-bot.herokuapp.com/sets?official=true'),
      fetcher('https://cerebro-beta-bot.herokuapp.com/packs?official=true'),
      fetcher('https://cerebro-beta-bot.herokuapp.com/sets?origin=unofficial'),
      fetcher('https://db.merlindumesnil.net/api/public/packs/')
    ]);

    const unofficialCerebroSets = (cerebroSets as CardSet[]).filter(x => !x.Official);
    const merlinPacks = (merlinPacksData as MerlinPack[]).filter(p => p.status !== "Official");

    return {
      props: {
        sets,
        packs,
        unofficialSets: unofficialCerebroSets,
        merlinPacks,
        setsError: false,
        packsError: false,
        serverOrigin: 'official'
      },
      revalidate: 3000,
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {
        sets: [],
        packs: [],
        unofficialSets: [],
        merlinPacks: [],
        setsError: true,
        packsError: true,
        serverOrigin: 'official'
      },
      revalidate: 3000,
    };
  }
}


export default Home;
