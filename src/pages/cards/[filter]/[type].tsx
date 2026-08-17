import { GetStaticPaths, GetStaticProps } from 'next';
import { ParsedUrlQuery } from 'querystring';
import { Card } from "@/models/Card";
import Results from "@/components/results/Results";
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import NoResults from '@/components/no-results/NoResults';
import PageMeta from '@/components/page-meta/PageMeta';
import SearchBar from '@/components/search-bar/SearchBar';

import { fetchCerebroCards } from '@/api/cerebro';
import { CerebroField, officialFieldQuery } from '@/api/cerebroQuery';
import { fetchMerlinCards } from '@/api/merlin';
import { BrowseFilter, parseBrowseRoute } from '@/api/routeParams';
import {
  CONTENT_REVALIDATE_SECONDS,
  NOT_FOUND_REVALIDATE_SECONDS,
  UpstreamUnavailableError,
} from '@/api/revalidate';
import { UpstreamResult } from '@/api/result';
import { merlinCardToCard } from '@/merlin-adapter';

interface PageProps {
  cards: Card[];
  cerebroQuery: string | null;
  detailsEnabled: boolean;
}

interface Params extends ParsedUrlQuery {
  filter: string;
  type: string;
}

const Page: React.FC<PageProps> = ({ cards, cerebroQuery, detailsEnabled }) => (
  <div>
    <PageMeta
      title="Browse cards"
      description={`${cards.length} cards in this collection.`}
    />
    <Header miniLogo={true} />
    <SearchBar />
    <main>
      {cards.length > 0
        ? <Results results={cards} cerebroQuery={cerebroQuery ?? undefined} detailsEnabled={detailsEnabled} />
        : <NoResults />}
    </main>
    <Footer />
  </div>
);

export const getStaticPaths: GetStaticPaths<Params> = async () => ({
  // No path is worth pre-rendering: collection IDs change every release and a
  // stale hardcoded entry only wastes build time. Everything is on demand.
  paths: [],
  fallback: 'blocking',
});

/** Official Cerebro collections support card detail pages; unofficial and Merlin cards do not. */
const detailsEnabledFor = (filter: BrowseFilter): boolean => filter !== 'ms' && filter !== 'usi';

const CEREBRO_FIELDS: Record<Exclude<BrowseFilter, 'ms'>, CerebroField> = {
  si: 'setId',
  usi: 'setId',
  pi: 'packId',
  cl: 'classification',
  type: 'cardType',
};

const fetchCollection = async (
  filter: BrowseFilter,
  type: string,
): Promise<{ result: UpstreamResult<Card[]>; cerebroQuery: string | null }> => {
  if (filter === 'ms') {
    const merlinResult = await fetchMerlinCards(type);
    const result: UpstreamResult<Card[]> = merlinResult.status === 'success'
      ? { status: 'success', data: merlinResult.data.map(merlinCardToCard) }
      : merlinResult;

    return { result, cerebroQuery: null };
  }

  const cerebroQuery = officialFieldQuery(CEREBRO_FIELDS[filter], type, filter !== 'usi');

  return { result: await fetchCerebroCards(cerebroQuery), cerebroQuery };
};

export const getStaticProps: GetStaticProps<PageProps, Params> = async ({ params }) => {
  const route = parseBrowseRoute(params?.filter, params?.type);

  // Unsupported filter or malformed collection ID: never reaches an upstream.
  if (!route) {
    return { notFound: true, revalidate: NOT_FOUND_REVALIDATE_SECONDS };
  }

  const { result, cerebroQuery } = await fetchCollection(route.filter, route.type);

  if (result.status === 'success') {
    return {
      props: {
        cards: result.data,
        cerebroQuery,
        detailsEnabled: detailsEnabledFor(route.filter),
      },
      revalidate: CONTENT_REVALIDATE_SECONDS,
    };
  }

  // A collection that genuinely holds no cards is not a page worth caching.
  if (result.status === 'empty') {
    return { notFound: true, revalidate: NOT_FOUND_REVALIDATE_SECONDS };
  }

  throw new UpstreamUnavailableError(result.reason);
};

export default Page;
