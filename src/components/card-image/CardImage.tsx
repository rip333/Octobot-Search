import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from '../../models/Card';
import styles from './CardImage.module.css';

interface CardImageProps {
  card: Card;
  artificialId?: string;
  /** Renders the reverse face of a double-sided card when one exists. */
  showBack?: boolean;
  priority?: boolean;
}

const CEREBRO_IMAGE_BASE_URL = 'https://cerebrodatastorage.blob.core.windows.net/cerebro-cards/';

/** Card stock comes in exactly two orientations; both are known before render. */
const PORTRAIT = { width: 365, height: 515 };
const LANDSCAPE = { width: 515, height: 365 };

/** Schemes are printed landscape. This depends only on card data, never on viewport width. */
const isLandscape = (card: Card): boolean => card.Type.includes('Scheme');

const STAGE_SIDE = /^[0-9]*([A-D])$/;

const ID_ENDS_IN_LETTER = /[a-z]$/i;

const imageId = (card: Card, id: string): string => {
  if (card.Type !== 'Main Scheme' || ID_ENDS_IN_LETTER.test(id)) return id;

  const side = card.Stage?.match(STAGE_SIDE)?.[1];
  return side ? `${id}${side}` : id;
};

const imageUrl = (card: Card, artificialId: string | undefined, showBack: boolean): string => {
  if (showBack && card.BackImageUrl) return card.BackImageUrl;
  if (card.ImageUrl) return card.ImageUrl;

  const id = imageId(card, artificialId || card.Id);
  const folder = card.Official ? 'official' : 'unofficial';
  return `${CEREBRO_IMAGE_BASE_URL}${folder}/${id}.jpg`;
};

const CardImage: React.FC<CardImageProps> = ({ card, artificialId, showBack = false, priority = false }) => {
  // Remembering *which* URL failed rather than a bare flag means switching
  // printings retries the new image instead of inheriting the old failure.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const source = imageUrl(card, artificialId, showBack);
  const failed = failedUrl === source;
  const { width, height } = isLandscape(card) ? LANDSCAPE : PORTRAIT;
  const orientation = isLandscape(card) ? 'landscape' : 'portrait';

  // Intrinsic dimensions are reserved either way, so a failed image does not
  // reflow everything below it.
  if (failed) {
    return (
      <div className={styles.frame} data-orientation={orientation}>
        <div className={styles.fallback} role="img" aria-label={`${card.Name} (image unavailable)`}>
          <span>{card.Name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.frame} data-orientation={orientation}>
      <Image
        className={styles.image}
        src={source}
        alt={card.Name}
        width={width}
        height={height}
        sizes={isLandscape(card) ? '(max-width: 768px) 92vw, 515px' : '(max-width: 768px) 45vw, 365px'}
        priority={priority}
        onError={() => setFailedUrl(source)}
      />
    </div>
  );
};

export default CardImage;
