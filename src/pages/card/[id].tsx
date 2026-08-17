import React from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { Card } from "@/models/Card";
import Header from "@/components/header/Header";
import CardDisplay from "@/components/card-display/CardDisplay";
import Footer from "@/components/footer/Footer";
import PageMeta from '@/components/page-meta/PageMeta';
import SearchBar from '@/components/search-bar/SearchBar';

import { fetchCerebroCards } from '@/api/cerebro';
import { OFFICIAL_ONLY, all, predicate, serializeCerebroQuery } from '@/api/cerebroQuery';
import { isCerebroCardId } from '@/api/routeParams';
import {
  CONTENT_REVALIDATE_SECONDS,
  NOT_FOUND_REVALIDATE_SECONDS,
  UpstreamUnavailableError,
} from '@/api/revalidate';

interface PageProps {
  card: Card;
}

interface Params extends ParsedUrlQuery {
  id: string;
}

const cardDescription = (card: Card): string => {
  const heading = card.Subname ? `${card.Name} - ${card.Subname}` : card.Name;
  return `${heading}. ${card.Classification} ${card.Type}.`.trim();
};

const Page: React.FC<PageProps> = ({ card }) => (
  <div>
    <PageMeta
      title={card.Subname ? `${card.Name} - ${card.Subname}` : card.Name}
      description={cardDescription(card)}
    />
    <Header miniLogo={true} />
    <SearchBar />
    <main>
      <CardDisplay card={card} />
    </main>
    <Footer />
  </div>
);

export const getStaticPaths: GetStaticPaths<Params> = async () => ({
  // Card pages are generated on demand; pre-rendering a fixed list would go
  // stale on every release without reducing cold-start work meaningfully.
  paths: [],
  fallback: 'blocking',
});

export const getStaticProps: GetStaticProps<PageProps, Params> = async ({ params }) => {
  const id = params?.id;

  // Reject malformed IDs before querying, so crawlers cannot mint cache entries.
  if (!isCerebroCardId(id)) {
    return { notFound: true, revalidate: NOT_FOUND_REVALIDATE_SECONDS };
  }

  const query = serializeCerebroQuery(all(predicate('id', id), OFFICIAL_ONLY));
  const result = await fetchCerebroCards(query);

  if (result.status === 'success') {
    return {
      props: { card: result.data[0] },
      revalidate: CONTENT_REVALIDATE_SECONDS,
    };
  }

  // Cerebro answered and has no such card. Expire soon so a newly published
  // card becomes reachable without a redeploy.
  if (result.status === 'empty') {
    return { notFound: true, revalidate: NOT_FOUND_REVALIDATE_SECONDS };
  }

  throw new UpstreamUnavailableError(result.reason);
};

export default Page;
