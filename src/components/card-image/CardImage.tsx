// CardImage.tsx
import React from 'react';
import { Card } from '../../models/Card';
import { AsyncImage } from 'loadable-image'
import styles from './CardImage.module.css';

interface CardImageProps {
  card: Card;
}

const CardImage: React.FC<CardImageProps> = ({ card }) => {
  const getImageUrl = (card: Card): string => {
    const imageBaseUrl = "https://cerebrodatastorage.blob.core.windows.net/cerebro-cards/";
    return card.Official
      ? `${imageBaseUrl}official/${card.Id}.jpg`
      : `${imageBaseUrl}unofficial/${card.Id}.jpg`;
  };

  // Basic mobile detection
  const isMobile = window.innerWidth <= 768; // Assuming 'mobile' is any screen width 768px or less
  let style = { width: 365, height: 515 }; // Default style

  if (card.Type.includes("Scheme")) {
    if (isMobile) {
      // Adjust for mobile
      style = { width: 365, height: 259 };
    } else {
      // Desktop
      style = { width: 515, height: 365 };
    }
  }

  return (
    <div className={styles.image}>
      <AsyncImage
        src={getImageUrl(card)}
        alt={card.Name}
        style={style}
      />
    </div>
  );
};

export default CardImage;
