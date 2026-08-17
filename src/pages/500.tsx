import React from 'react';
import Footer from '@/components/footer/Footer';
import Header from '@/components/header/Header';
import PageMeta from '@/components/page-meta/PageMeta';
import SearchBar from '@/components/search-bar/SearchBar';

/**
 * Rendered when card data cannot be generated because Cerebro or Merlin is
 * unavailable. Pages that already generated successfully keep serving their
 * last good version, so reaching this page means there is nothing cached yet.
 */
const ServerError: React.FC = () => (
  <div>
    <PageMeta
      title="Temporarily unavailable"
      description="Card data is temporarily unavailable."
      noIndex
    />
    <Header miniLogo={true} />
    <SearchBar />
    <main style={{ padding: '2rem 1rem', textAlign: 'center' }}>
      <h1>Card data is temporarily unavailable</h1>
      <p>The card database did not respond. Reloading in a moment usually fixes this.</p>
    </main>
    <Footer />
  </div>
);

export default ServerError;
