import { GetStaticPaths, GetStaticProps } from 'next';
import axios from "axios";
import { Card } from "@/models/Card";
import Results from "@/components/results/Results";
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { ParsedUrlQuery } from 'querystring';
import Loading from '@/components/loading/Loading';
import { fetchMerlinCards } from '@/merlin-api';
import { merlinCardToCard } from '@/merlin-adapter';
import SearchBar from '@/components/search-bar/SearchBar';

const fetcher = async (url: string) => {
  const res = await axios.get(url);
  return res.data;
};

interface PageProps {
  cards: Card[];
  loading: boolean;
  error: boolean;
  cerebroQuery?: string;
  origin?: string;
  detailsEnabled: boolean;
}

interface Params extends ParsedUrlQuery {
  filter: string;
  type: string;
}

const Page: React.FC<PageProps> = ({ cards, loading, error, cerebroQuery, detailsEnabled }) => {
  if (error) {
    console.error('Error fetching cards');
  }

  return (
    <div>
      <Header miniLogo={true} />
      <SearchBar />
      {loading && <Loading />}
      {!loading && <Results results={cards || []} cerebroQuery={cerebroQuery} detailsEnabled={detailsEnabled} />}
      <Footer />
    </div>
  );
};

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  // Define paths for pre-rendering
  const paths = [
    { params: { filter: 'si', type: 'core' } },
  ];

  return {
    paths,
    fallback: 'blocking', // Enable blocking fallback for dynamic routes
  };
};

export const getStaticProps: GetStaticProps<PageProps, Params> = async ({ params }) => {
  const { filter, type } = params!;

  try {
    let cards: Card[] = [];
    let query = "";
    let origin = "official";

    if (filter === "ms") {
      // Merlin Set
      const merlinCards = await fetchMerlinCards(type);
      cards = merlinCards.map(merlinCardToCard);
      origin = "unofficial"; // Or "merlin" if we add that to Header
    } else if (filter === "usi") {
      // Unofficial Cerebro Set
      query = `input=(si:"${type}"%26o:"false")`;
      cards = await fetcher(`https://cerebro-beta-bot.herokuapp.com/query?${query}`);
      origin = "unofficial";
    } else if (filter === "dl") {
      // MarvelCDB Decklist
      const decklist = await fetcher(`https://marvelcdb.com/api/public/decklist/${type}`);
      const slots = decklist.slots;
      const cardIds = Object.keys(slots);

      if (cardIds.length > 0) {
        // Construct query: input=(id:"01001"|id:"01002"|...)
        const idFilters = cardIds.map(id => `id:"${id}"`).join('|');
        query = `input=(${idFilters})`;

        cards = await fetcher(`https://cerebro-beta-bot.herokuapp.com/query?${query}`);
      } else {
        cards = [];
      }

      origin = "official";
    } else {
      // Default (Cerebro Official)
      query = `input=(${filter}:"${type}"%26o:"true")`;
      cards = await fetcher(`https://cerebro-beta-bot.herokuapp.com/query?${query}`);
      origin = "official";
    }

    return {
      props: {
        cards,
        loading: false,
        error: false,
        cerebroQuery: query,
        origin,
        detailsEnabled: filter != "ms" && filter != "usi",
      },
      revalidate: 604800, // Revalidate every week
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {
        cards: [],
        loading: false,
        error: true,
        detailsEnabled: false,
      },
      revalidate: 604800, // Revalidate every week
    };
  }
}

export default Page;
