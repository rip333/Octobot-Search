import { GetStaticPaths, GetStaticProps } from 'next';
import axios from "axios";
import { Card } from "@/models/Card";
import Results from "@/components/results/Results";
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { ParsedUrlQuery } from 'querystring';

const fetcher = async (url: string) => {
  const res = await axios.get(url);
  return res.data;
};

interface PageProps {
  cards: Card[];
  loading: boolean;
  error: boolean;
}

interface Params extends ParsedUrlQuery {
  filter: string;
  type: string;
}

const Page: React.FC<PageProps> = ({ cards, loading, error }) => {
  if (error) {
    console.error('Error fetching cards');
  }

  return (
    <div>
      <Header miniLogo={true} />
      <Results results={cards || []} loading={loading} />
      <Footer />
    </div>
  );
};

export const getStaticPaths: GetStaticPaths<Params> = async () => {
  // Define paths for pre-rendering
  const paths = [
    { params: { filter: 'exampleFilter1', type: 'exampleType1' } },
    { params: { filter: 'exampleFilter2', type: 'exampleType2' } },
  ];

  return {
    paths,
    fallback: 'blocking', // Enable blocking fallback for dynamic routes
  };
};

export const getStaticProps: GetStaticProps<PageProps, Params> = async ({ params }) => {
  const { filter, type } = params!;

  try {
    const cards = await fetcher(`https://cerebro-beta-bot.herokuapp.com/query?input=(${filter}:"${type}")&origin:"official"`);
    return {
      props: {
        cards,
        loading: false,
        error: false,
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
      },
      revalidate: 604800, // Revalidate every week
    };
  }
}

export default Page;
