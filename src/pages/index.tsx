import React from 'react';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import PageMeta from '@/components/page-meta/PageMeta';
import Browse from '@/components/browse/Browse';
import SearchBar from '@/components/search-bar/SearchBar';
import { CardSet } from "@/models/CardSet";
import { CardPack } from "@/models/CardPack";

import { fetchCerebroPacks, fetchCerebroSets } from '@/api/cerebro';
import {
  LISTING_REVALIDATE_SECONDS,
  PARTIAL_FAILURE_REVALIDATE_SECONDS,
  UpstreamUnavailableError,
} from '@/api/revalidate';
import { isUpstreamFailure, listOrEmpty } from '@/api/result';

interface HomeProps {
  sets: CardSet[];
  packs: CardPack[];
  /** True when that section's upstream failed; the rest of the page still renders. */
  setsUnavailable: boolean;
  packsUnavailable: boolean;
}

const Home: React.FC<HomeProps> = ({ sets, packs, setsUnavailable, packsUnavailable }) => {
  const router = useRouter();
  const isUnofficial = router.query.origin === 'unofficial';

  return (
    <div style={{ textAlign: "center" }}>
      <PageMeta description="Search and browse official Marvel Champions cards, sets, and packs." />
      <Header miniLogo={false} />
      <SearchBar />
      <main>
        <Browse
          isUnofficial={isUnofficial}
          sets={sets}
          packs={packs}
          setsUnavailable={setsUnavailable}
          packsUnavailable={packsUnavailable}
        />
      </main>
      <Footer />
    </div>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  // Community data is fetched on demand by `/api/browse/unofficial`, so the
  // default view only pays for the two official listings.
  const [setsResult, packsResult] = await Promise.all([
    fetchCerebroSets(true),
    fetchCerebroPacks(),
  ]);

  const setsUnavailable = isUpstreamFailure(setsResult);
  const packsUnavailable = isUpstreamFailure(packsResult);

  // Nothing useful to show and nothing worth caching.
  if (setsUnavailable && packsUnavailable) {
    throw new UpstreamUnavailableError(
      isUpstreamFailure(setsResult) ? setsResult.reason : 'Cerebro is unavailable.',
    );
  }

  return {
    props: {
      sets: listOrEmpty(setsResult),
      packs: listOrEmpty(packsResult),
      setsUnavailable,
      packsUnavailable,
    },
    revalidate: setsUnavailable || packsUnavailable
      ? PARTIAL_FAILURE_REVALIDATE_SECONDS
      : LISTING_REVALIDATE_SECONDS,
  };
};

export default Home;
