/** Container checks only: bounded byte walks, without decompressing pixels or transforming art. */
function jpeg(body: Buffer): boolean {
  if (body.length < 4 || body.readUInt16BE(0) !== 0xffd8) return false;
  let offset = 2;
  let frame = false;
  let scan = false;
  let imageData = false;
  while (offset < body.length) {
    if (body[offset++] !== 0xff) return false;
    while (body[offset] === 0xff) offset++;
    if (offset >= body.length) return false;
    const marker = body[offset++];
    if (marker === 0xd9) return frame && scan && imageData;
    if (marker === 0x01) continue;
    if (marker === 0x00 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || offset + 2 > body.length) return false;
    const length = body.readUInt16BE(offset);
    if (length < 2 || offset + length > body.length) return false;
    // SOF markers exclude DHT, JPG and DAC. Baseline and progressive frames share this layout.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      if (length < 8 || !body[offset + 7] || length !== 8 + 3 * body[offset + 7]
        || !body.readUInt16BE(offset + 3) || !body.readUInt16BE(offset + 5)) return false;
      frame = true;
    }
    if (marker === 0xda) {
      if (!frame || length < 6 || !body[offset + 2] || length !== 6 + 2 * body[offset + 2]) return false;
      scan = true;
      offset += length;
      // Entropy data can contain stuffed FF bytes and restart markers; progressive images have multiple scans.
      while (offset < body.length) {
        if (body[offset] !== 0xff) { imageData = true; offset++; continue; }
        const next = body[offset + 1];
        if (next === 0x00) { imageData = true; offset += 2; continue; }
        if (next >= 0xd0 && next <= 0xd7) { offset += 2; continue; }
        break;
      }
    } else offset += length;
  }
  return false;
}

function png(body: Buffer): boolean {
  if (!body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return false;
  let data = false;
  for (let offset = 8; offset + 12 <= body.length;) {
    const length = body.readUInt32BE(offset);
    const type = body.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    if (end > body.length) return false;
    if (offset === 8) {
      if (type !== 'IHDR' || length !== 13 || !body.readUInt32BE(offset + 8) || !body.readUInt32BE(offset + 12)) return false;
    } else if (type === 'IHDR') return false;
    if (type === 'IDAT' && length > 0) data = true;
    if (type === 'IEND') return data && length === 0 && end === body.length;
    offset = end;
  }
  return false;
}

function gif(body: Buffer): boolean {
  if (body.length < 13 || !['GIF87a', 'GIF89a'].includes(body.toString('ascii', 0, 6))
    || !body.readUInt16LE(6) || !body.readUInt16LE(8)) return false;
  let offset = 13 + (body[10] & 0x80 ? 3 * (1 << ((body[10] & 7) + 1)) : 0);
  let image = false;
  // Both extension blocks and compressed image data end with a zero-sized sub-block.
  const subBlocks = (): number => {
    let bytes = 0;
    while (offset < body.length) {
      const length = body[offset++];
      if (length === 0) return bytes;
      if (offset + length > body.length) return -1;
      bytes += length;
      offset += length;
    }
    return -1;
  };
  while (offset < body.length) {
    const kind = body[offset++];
    if (kind === 0x3b) return image;
    if (kind === 0x21) {
      if (offset >= body.length) return false;
      offset++; // Extension label.
      if (subBlocks() < 0) return false;
    } else if (kind === 0x2c) {
      if (offset + 9 > body.length || !body.readUInt16LE(offset + 4) || !body.readUInt16LE(offset + 6)) return false;
      const packed = body[offset + 8];
      offset += 9 + (packed & 0x80 ? 3 * (1 << ((packed & 7) + 1)) : 0);
      if (offset >= body.length || body[offset] < 2 || body[offset] > 8) return false;
      offset++; // LZW minimum code size.
      if (subBlocks() <= 0) return false;
      image = true;
    } else return false;
  }
  return false;
}

function webpChunks(body: Buffer, start: number, end: number, inFrame = false): boolean {
  let image = false;
  let offset = start;
  while (offset + 8 <= end) {
    const type = body.toString('ascii', offset, offset + 4);
    const length = body.readUInt32LE(offset + 4);
    const data = offset + 8;
    const next = data + length + (length & 1);
    if (next > end) return false;
    if (type === 'VP8 ') {
      if (length <= 10 || (body[data] & 1) || body.toString('hex', data + 3, data + 6) !== '9d012a'
        || !(body.readUInt16LE(data + 6) & 0x3fff) || !(body.readUInt16LE(data + 8) & 0x3fff)) return false;
      image = true;
    } else if (type === 'VP8L') {
      if (length <= 5 || body[data] !== 0x2f || (body[data + 4] & 0xe0)) return false;
      image = true;
    } else if (type === 'VP8X' && (inFrame || length !== 10)) return false;
    else if (type === 'ANMF') {
      if (inFrame || length < 16 || !webpChunks(body, data + 16, data + length, true)) return false;
      image = true;
    }
    offset = next;
  }
  return offset === end && image;
}

/** Reject missing trailers, incomplete segments/chunks/blocks, and header-only files.
 * This does not validate compressed pixel semantics or substitute for a full image decoder.
 * Formats: ITU T.81; W3C PNG/GIF; developers.google.com/speed/webp/docs/riff_container.
 */
export function hasCompleteImageStructure(body: Buffer, mime: string): boolean {
  if (mime === 'image/jpeg') return jpeg(body);
  if (mime === 'image/png') return png(body);
  if (mime === 'image/gif') return gif(body);
  return mime === 'image/webp' && body.length >= 12 && body.toString('ascii', 0, 4) === 'RIFF'
    && body.toString('ascii', 8, 12) === 'WEBP' && body.readUInt32LE(4) + 8 === body.length
    && webpChunks(body, 12, body.length);
}
