import Header from "@/components/header/Header";
import HeroSelect from "@/components/hero-select/HeroSelect";
import { useEffect, useState } from 'react';
import { CardSet } from "../models/CardSet";
import { CardPack } from "../models/CardPack";
import axios from "axios";
import CardSets from "@/components/card-sets/CardSets";
import CardPacks from "@/components/card-packs/CardPacks";
import Classifications from "@/components/classifications/Classifications";
import Footer from "@/components/footer/Footer";

const Home: React.FC = () => {
  const [sets, setSets] = useState<CardSet[]>([]);
  const [packs, setPacks] = useState<CardPack[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        let setsResults = await axios.get(`https://cerebro-beta-bot.herokuapp.com/sets?official=true`);
        setSets(setsResults?.data);
        let packsResults = await axios.get(`https://cerebro-beta-bot.herokuapp.com/packs?official=true`);
        setPacks(packsResults?.data);
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
    <div style={{ textAlign: "center" }}>
      <Header miniLogo={false} />
      <div style={{ width: "90%", display: "inline-block" }}>
        <CardSets cardSets={sets} />
        <CardPacks cardPacks={packs} />
        <Classifications />
        <Footer />
      </div>
    </div>
  );
}

export default Home;
