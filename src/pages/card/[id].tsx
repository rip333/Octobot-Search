import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import axios from "axios";
import { Card } from "@/models/Card";
import Header from "@/components/header/Header";
import CardDisplay from "@/components/card-display/CardDisplay";
import Footer from "@/components/footer/Footer";

interface PageProps {
  card: Card | null;
  error: boolean;
}

const fetcher = async (url: string) => {
  const res = await axios.get(url);
  return res.data;
};

const Page: React.FC<PageProps> = ({ card, error }) => {
  if (error) {
    console.error('Error fetching card');
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

export const getStaticPaths: GetStaticPaths = async () => {
  // Fetch or define the list of paths to be pre-rendered
  const res = await axios.get('https://cerebro-beta-bot.herokuapp.com/cards'); // Adjust the endpoint as needed
  const cards: Card[] = res.data;

  const paths = cards.map(card => ({
    params: { id: card.Id.toString() }
  }));

  return {
    paths,
    fallback: 'blocking', // Enable blocking fallback for dynamic routes
  };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const { id } = params!;

  try {
    const data = await fetcher(`https://cerebro-beta-bot.herokuapp.com/query?input=(id:"${id}"%26o:"true")`);
    const card = data ? data[0] : null;

    return {
      props: {
        card,
        error: false,
      },
      revalidate: 604800, // Revalidate every week
    };
  } catch (error) {
    console.error('Error fetching card:', error);

    return {
      props: {
        card: null,
        error: true,
      },
      revalidate: 604800, // Revalidate every week
    };
  }
};

export default Page;
