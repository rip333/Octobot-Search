import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '@/components/header/Header';
import Footer from '@/components/footer/Footer';
import { DriveExplorer } from '@/components/drive/DriveExplorer';
import styles from '@/styles/Profile.module.css';
import { getCreatorByNameOrId, extractDriveFolderId } from '@/data/creators';

export default function CreatorDrivePage() {
  const router = useRouter();
  const { id } = router.query;

  const paramId = (typeof id === 'string' && id) ? id : '';
  const creator = paramId ? getCreatorByNameOrId(paramId) : undefined;

  const folderId = creator ? creator.driveFolderId : extractDriveFolderId(paramId);
  const name = creator ? creator.name : 'Creator Content';

  return (
    <>
      <Head>
        <title>{name} - Octobot Search</title>
        <meta
          name="description"
          content={`Explore content shared by ${name}`}
        />
      </Head>

      <Header miniLogo={true} />

      <main className={styles.profileContainer}>
        {folderId ? (
          <DriveExplorer
            initialFolderId={folderId}
            title={name}
            allowUrlInput={false}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
            Loading creator content...
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
