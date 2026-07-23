import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import axios from "axios";
import { Card } from "@/models/Card";
import Header from "@/components/header/Header";
import CardDisplay from "@/components/card-display/CardDisplay";
import Footer from "@/components/footer/Footer";
import SearchBar from '@/components/search-bar/SearchBar';

import { fetcherWithRetry } from '@/utils/fetcher';

interface PageProps {
  card: Card | null;
  error: boolean;
}

const Page: React.FC<PageProps> = ({ card, error }) => {
  if (error) {
    console.error('Error fetching card');
    return <div>Error loading the card.</div>;
  }

  if (!card) {
    return (
      <div>
        <Header miniLogo={true} />
        <SearchBar />
        <div>Loading...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header miniLogo={true} />
      <SearchBar />
      <CardDisplay card={card} />
      <Footer />
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const { id } = params!;

  try {
    const data = await fetcherWithRetry(`https://cerebro-beta-bot.herokuapp.com/query?input=(id:"${id}"%26o:"true")`);
    const card = data && data.length > 0 ? data[0] : null;

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
