import { describe, expect, it } from 'vitest';
import { canonicalImageSource, imageKey } from './cardImageSource';

describe('canonical image delivery', () => {
  it('preserves the creator folder in real unofficial Cerebro IDs', () => {
    expect(canonicalImageSource('https://pub-d27e6715f4ba4529bc9d8fd13938a5a1.r2.dev/cerebro-cards/unofficial/237660307835715585/01001B.jpg'))
      .toBe('/api/card-images/v1/unofficial/237660307835715585/01001B.jpg');
    expect(imageKey('unofficial', ['237660307835715585', '01001B.jpg']))
      .toBe('unofficial/237660307835715585/01001B.jpg');
    expect(imageKey('official', ['237660307835715585', '01001B.jpg'])).toBeNull();
    expect(imageKey('unofficial', ['237660307835715585', '..', '01001B.jpg'])).toBeNull();
  });
  it('migrates explicit Azure and R2 URLs to the same local key', () => {
    for (const host of ['cerebrodatastorage.blob.core.windows.net', 'pub-d27e6715f4ba4529bc9d8fd13938a5a1.r2.dev']) {
      expect(canonicalImageSource(`https://${host}/cerebro-cards/official/00001A.jpg`))
        .toBe('/api/card-images/v1/official/00001A.jpg');
    }
  });
  it('keeps Merlin and rejects unrecognized origins and ambiguous keys', () => {
    expect(canonicalImageSource('https://mc4db.merlindumesnil.net/bundles/front.webp'))
      .toBe('https://mc4db.merlindumesnil.net/bundles/front.webp');
    for (const url of ['https://example.test/art.jpg', 'https://cerebrodatastorage.blob.core.windows.net.evil.test/cerebro-cards/official/1.jpg',
      'https://cerebrodatastorage.blob.core.windows.net/cerebro-cards/official/%31.jpg',
      'https://pub-d27e6715f4ba4529bc9d8fd13938a5a1.r2.dev/cerebro-cards/official/1.jpg?x=1']) {
      expect(canonicalImageSource(url)).toBeNull();
    }
    expect(imageKey('unofficial', 'art-key_1.jpg')).toBe('unofficial/art-key_1.jpg');
    expect(imageKey('official', '../1.jpg')).toBeNull();
  });
});
