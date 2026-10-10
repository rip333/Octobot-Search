import { describe, expect, it } from 'vitest';
import { images } from './__fixtures__/cardImages';
import { hasCompleteImageStructure } from './cardImageStructure';

describe('bounded image container validation', () => {
  it.each(Object.entries(images))('rejects every incomplete prefix of %s', (_name, image) => {
    for (let end = 0; end < image.body.length; end++) {
      expect(hasCompleteImageStructure(image.body.subarray(0, end), image.mime), `prefix ${end}`).toBe(false);
    }
    expect(hasCompleteImageStructure(image.body, image.mime)).toBe(true);
  });

  it('rejects JPEG headers with a forged end marker but no frame or scan data', () => {
    expect(hasCompleteImageStructure(Buffer.from([255, 216, 255, 217]), 'image/jpeg')).toBe(false);
    const truncatedSegment = Buffer.concat([images.jpeg.body.subarray(0, 20), Buffer.from([255, 217])]);
    expect(hasCompleteImageStructure(truncatedSegment, 'image/jpeg')).toBe(false);
  });

  it('rejects a PNG with an incomplete chunk even when the end chunk is present', () => {
    const malformed = Buffer.from(images.png.body);
    malformed.writeUInt32BE(0xffffffff, 33); // Claim an impossible pHYs chunk size.
    expect(hasCompleteImageStructure(malformed, 'image/png')).toBe(false);
    const noPixels = Buffer.concat([images.png.body.subarray(0, 33), images.png.body.subarray(-12)]);
    expect(hasCompleteImageStructure(noPixels, 'image/png')).toBe(false);
  });

  it('rejects a GIF with a trailer but an incomplete image data sub-block', () => {
    const malformed = Buffer.from(images.gif.body);
    malformed[38] = 255; // Data sub-block length exceeds the remaining file.
    expect(hasCompleteImageStructure(malformed, 'image/gif')).toBe(false);
    expect(hasCompleteImageStructure(Buffer.concat([images.gif.body.subarray(0, 13), Buffer.from([59])]), 'image/gif')).toBe(false);
  });

  it('rejects incomplete WebP chunks even if the outer RIFF size was adjusted', () => {
    const truncated = Buffer.from(images.webp.body.subarray(0, images.webp.body.length - 2));
    truncated.writeUInt32LE(truncated.length - 8, 4);
    expect(hasCompleteImageStructure(truncated, 'image/webp')).toBe(false);
    const malformed = Buffer.from(images.losslessWebp.body);
    malformed.writeUInt32LE(0xffffffff, 16);
    expect(hasCompleteImageStructure(malformed, 'image/webp')).toBe(false);
  });
});
