import React from 'react';
import Link from 'next/link';
import Footer from '@/components/footer/Footer';
import Header from '@/components/header/Header';
import PageMeta from '@/components/page-meta/PageMeta';
import SearchBar from '@/components/search-bar/SearchBar';

/**
 * Reached for cards and collections Cerebro does not have, and for route
 * parameters that fail validation before any upstream call is made.
 */
const NotFound: React.FC = () => (
  <div>
    <PageMeta
      title="Not found"
      description="That card or collection does not exist."
      noIndex
    />
    <Header miniLogo={true} />
    <SearchBar />
    <main style={{ padding: '2rem 1rem', textAlign: 'center' }}>
      <h1>Not found</h1>
      <p>That card or collection does not exist. Try a search, or <Link href="/">browse from the start</Link>.</p>
    </main>
    <Footer />
  </div>
);

export default NotFound;
