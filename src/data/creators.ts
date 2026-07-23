import creatorsData from './creators.json';

export interface Creator {
  name: string;
  driveUrl: string;
  description?: string;
}

export interface ParsedCreator extends Creator {
  id: string;
  driveFolderId: string;
  pagePath: string;
}

export function extractDriveFolderId(input: string): string {
  if (!input) return '';
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return input.trim();
}

export function getCreators(): ParsedCreator[] {
  return (creatorsData as Creator[]).map((c) => {
    const driveFolderId = extractDriveFolderId(c.driveUrl);
    const id = c.name.toLowerCase();
    return {
      ...c,
      id,
      driveFolderId,
      pagePath: `/creators/${encodeURIComponent(id)}`,
    };
  });
}

export function getCreatorByNameOrId(query: string): ParsedCreator | undefined {
  if (!query) return undefined;
  const q = query.toLowerCase().trim();
  const creators = getCreators();
  return creators.find(
    (c) => c.name.toLowerCase() === q || c.id === q || c.driveFolderId === query
  );
}
