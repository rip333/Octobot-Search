import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
}

export interface DriveFolderResponse {
  folderId: string;
  folderName?: string;
  parentFolderId?: string;
  items: DriveItem[];
  error?: string;
}

function extractFolderId(input: string): string {
  if (!input) return '';
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return input.trim();
}

function getDriveClient() {
  let keyFile: any;

  if (process.env.GCP_KEY_JSON) {
    try {
      keyFile = typeof process.env.GCP_KEY_JSON === 'string'
        ? JSON.parse(process.env.GCP_KEY_JSON)
        : process.env.GCP_KEY_JSON;
    } catch (e) {
      throw new Error('GCP_KEY_JSON environment variable is not valid JSON.');
    }
  } else {
    const keyPath = path.join(process.cwd(), 'gcp-key.json');
    if (!fs.existsSync(keyPath)) {
      throw new Error('Google Drive credentials not configured. Please add GCP_KEY_JSON environment variable or gcp-key.json file to root.');
    }
    keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }

  const clientEmail = keyFile.client_email;
  const privateKey = keyFile.private_key ? keyFile.private_key.replace(/\\n/g, '\n') : '';

  if (!clientEmail || !privateKey) {
    throw new Error('Invalid GCP Service Account key structure.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  return google.drive({ version: 'v3', auth });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DriveFolderResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ folderId: '', items: [], error: 'Method not allowed' });
  }

  const rawFolder = (req.query.folderId as string) || (req.query.url as string);
  if (!rawFolder) {
    return res.status(400).json({ folderId: '', items: [], error: 'Folder ID or URL parameter required' });
  }

  const targetFolderId = extractFolderId(rawFolder);
  if (!targetFolderId || targetFolderId === 'undefined' || targetFolderId === 'null') {
    return res.status(400).json({ folderId: '', items: [], error: 'Valid Folder ID or URL parameter required' });
  }

  try {
    const drive = getDriveClient();

    // 1. Get folder metadata (name & parents)
    let folderName = 'Folder';
    let parentFolderId: string | undefined = undefined;

    try {
      const metaRes = await drive.files.get({
        fileId: targetFolderId,
        fields: 'id, name, parents',
        supportsAllDrives: true,
      });

      folderName = metaRes.data.name || 'Folder';
      if (metaRes.data.parents && metaRes.data.parents.length > 0) {
        parentFolderId = metaRes.data.parents[0];
      }
    } catch (e: any) {
      console.warn('Could not fetch folder metadata:', e?.message || e);
    }

    // 2. List items in folder
    const listRes = await drive.files.list({
      q: `'${targetFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink, webContentLink)',
      pageSize: 1000,
      orderBy: 'folder,name',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = listRes.data.files || [];

    const items: DriveItem[] = files.map((file) => {
      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
      return {
        id: file.id || '',
        name: file.name || 'Untitled',
        mimeType: file.mimeType || '',
        isFolder,
        size: file.size || undefined,
        modifiedTime: file.modifiedTime || undefined,
        thumbnailLink: file.thumbnailLink || undefined,
        webViewLink: file.webViewLink || undefined,
        webContentLink: file.webContentLink || undefined,
      };
    });

    return res.status(200).json({
      folderId: targetFolderId,
      folderName,
      parentFolderId,
      items,
    });
  } catch (err: any) {
    console.error('Google Drive API Error:', err);
    return res.status(500).json({
      folderId: targetFolderId,
      items: [],
      error: err?.message || 'Failed to fetch items from Google Drive API',
    });
  }
}
