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
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number }>({ width: 365, height: 515 });

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

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    if (card.Type.includes("Scheme")) {
      const schemeHeight = isMobile ? 259 : 365;
      const schemeWidth = isMobile ? 365 : 515;
      setImageDimensions({ width: schemeWidth, height: schemeHeight });
    } else {
      const newHeight = 515;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const newWidth = newHeight * aspectRatio;
      setImageDimensions({ width: newWidth, height: newHeight });
    }
  };

  return (
    <div className={styles.image}>
      <AsyncImage
        src={getImageUrl()}
        alt={card.Name}
        onLoad={handleImageLoad}
        style={{ width: imageDimensions.width, height: imageDimensions.height }}
      />
    </div>
  );
};

export default CardImage;
