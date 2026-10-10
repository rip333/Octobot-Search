import type { NextApiRequest, NextApiResponse } from 'next';
import { imageKey, IMAGE_ROUTE } from '@/api/cardImageSource';
import { fetchCardImage } from '@/api/cardImageBinary';

export const config = { api: { bodyParser: false, responseLimit: '3mb' } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).end(); return;
  }
  const key = imageKey(req.query.origin, req.query.filename);
  if (!key || req.url !== `${IMAGE_ROUTE}${key}` || Object.keys(req.query).some(k => k !== 'origin' && k !== 'filename')
    || req.headers.authorization !== undefined || req.headers.range !== undefined) {
    res.status(400).end(); return;
  }
  const result = await fetchCardImage(key);
  if (result.status === 200) {
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.setHeader('CDN-Cache-Control', 'public, s-maxage=2592000');
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Length', result.body.length);
    res.status(200);
    res.end(req.method === 'HEAD' ? undefined : result.body);
  } else {
    if (result.status === 404) {
      res.setHeader('Cache-Control', 'public, max-age=0');
      res.setHeader('CDN-Cache-Control', 'public, s-maxage=60');
    }
    res.status(result.status).end();
  }
}
