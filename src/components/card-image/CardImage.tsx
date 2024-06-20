import React, { useState, useEffect } from 'react';
import { Card } from '../../models/Card';
import { AsyncImage } from 'loadable-image';
import styles from './CardImage.module.css';

interface CardImageProps {
  card: Card;
  artificialId?: string;
}

const CardImage: React.FC<CardImageProps> = ({ card, artificialId }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getImageUrl = (): string => {
    const imageBaseUrl = "https://cerebrodatastorage.blob.core.windows.net/cerebro-cards/";
    const id = artificialId || card.Id;
    return card.Official
      ? `${imageBaseUrl}official/${id}.jpg`
      : `${imageBaseUrl}unofficial/${id}.jpg`;
  };

  const getStyle = (): { width: number, height: number } => {
    if (card.Id === "42001C") {
      return { width: 715, height: 515 };
    }
    if (card.Type.includes("Scheme")) {
      return isMobile
        ? { width: 365, height: 259 }
        : { width: 515, height: 365 };
    }
    return { width: 365, height: 515 };
  };

  return (
    <div className={styles.image}>
      <AsyncImage
        src={getImageUrl()}
        alt={card.Name}
        style={getStyle()}
      />
    </div>
  );
};

export default CardImage;
