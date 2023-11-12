import Header from "@/components/header/Header";
import HeroSelect from "@/components/hero-select/HeroSelect";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { CardSet } from "../models/CardSet";
import axios from "axios";
import CardSets from "@/components/card-sets/CardSets";

const Home: React.FC = () => {

  const router = useRouter();
  const [sets, setSets] = useState<CardSet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        let results = await axios.get(`https://cerebro-beta-bot.herokuapp.com/sets?official=true`);
        setSets(results?.data);
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
    <div>
      <Header />
      <HeroSelect />
      <CardSets cardSets={sets} />
    </div>
  );
}

export default Home;
