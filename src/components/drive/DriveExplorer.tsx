import React, { useState, useEffect } from 'react';
import styles from '@/styles/DriveExplorer.module.css';
import { DriveItem, DriveFolderResponse } from '@/pages/api/drive/files';
import { Folder, FileText, Download, ArrowUpRight, MagnifyingGlass } from '@phosphor-icons/react';

interface Breadcrumb {
  id: string;
  name: string;
}

interface DriveExplorerProps {
  initialFolderId: string;
  title?: string;
  subtitle?: string;
  allowUrlInput?: boolean;
}

export const DriveExplorer: React.FC<DriveExplorerProps> = ({
  initialFolderId,
  title = 'Google Drive Explorer',
  allowUrlInput = false,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string>(initialFolderId);
  const [inputUrl, setInputUrl] = useState<string>('');
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);

  useEffect(() => {
    if (!currentFolderId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/drive/files?folderId=${encodeURIComponent(currentFolderId)}`)
      .then((res) => res.json())
      .then((data: DriveFolderResponse) => {
        if (!isMounted) return;

        if (data.error) {
          setError(data.error);
          setItems([]);
        } else {
          setItems(data.items || []);

          const folderName = data.folderName || 'Folder';
          setBreadcrumbs((prev) => {
            const index = prev.findIndex((b) => b.id === currentFolderId);
            if (index !== -1) {
              return prev.slice(0, index + 1);
            } else {
              return [...prev, { id: currentFolderId, name: folderName }];
            }
          });
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Fetch error:', err);
        setError('Failed to connect to Google Drive service API.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentFolderId]);

  const handleFolderClick = (folder: DriveItem) => {
    setSearchQuery('');
    setCurrentFolderId(folder.id);
  };

  const handleBreadcrumbClick = (id: string) => {
    setSearchQuery('');
    setCurrentFolderId(id);
  };

  const handleLoadCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setBreadcrumbs([]);
    setCurrentFolderId(inputUrl.trim());
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getHighResThumbnail = (link?: string) => {
    if (!link) return null;
    return link.replace(/=s\d+/, '=s1000');
  };

  const isImage = (mimeType: string, name: string) => {
    return (
      mimeType.startsWith('image/') ||
      /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(name)
    );
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
      </div>

      {allowUrlInput && (
        <form onSubmit={handleLoadCustomUrl} className={styles.urlInputBar}>
          <input
            type="text"
            className={styles.urlInput}
            placeholder="Paste any public Google Drive URL or Folder ID..."
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
          />
          <button type="submit" className={styles.loadBtn}>
            Open Folder
          </button>
        </form>
      )}

      {/* Navigation Controls & Breadcrumbs */}
      <div className={styles.controlsRow}>
        <div className={styles.breadcrumbs}>
          {breadcrumbs.map((b, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={b.id}>
                {idx > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                {isLast ? (
                  <span className={styles.breadcrumbCurrent}>{b.name}</span>
                ) : (
                  <button
                    className={styles.breadcrumbItem}
                    onClick={() => handleBreadcrumbClick(b.id)}
                  >
                    {b.name}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className={styles.searchBox}>
          <MagnifyingGlass size={18} color="#888" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Filter current folder..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {loading ? (
        <div className={styles.statusMessage}>Loading contents from Google Drive...</div>
      ) : filteredItems.length === 0 ? (
        <div className={styles.emptyState}>
          {searchQuery ? 'No matching items found.' : 'This folder is empty.'}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredItems.map((item) => {
            const thumbnail = getHighResThumbnail(item.thumbnailLink);
            const imageFile = isImage(item.mimeType, item.name);

            // 1. Folders
            if (item.isFolder) {
              return (
                <div
                  key={item.id}
                  className={styles.folderCard}
                  onClick={() => handleFolderClick(item)}
                >
                  <Folder className={styles.folderIcon} weight="duotone" />
                  <div className={styles.folderName}>{item.name}</div>
                </div>
              );
            }

            // 2. Pure Image Display
            if (imageFile) {
              return (
                <div
                  key={item.id}
                  className={styles.imageCard}
                  onClick={() => setPreviewItem(item)}
                >
                  <img
                    src={thumbnail || item.webContentLink}
                    alt={item.name}
                    className={styles.cardImage}
                    loading="lazy"
                  />
                  <div className={styles.imageLabel}>{item.name}</div>
                </div>
              );
            }

            // 3. Other Non-Image Files
            return (
              <div
                key={item.id}
                className={styles.fileCard}
                onClick={() => {
                  if (item.webViewLink) window.open(item.webViewLink, '_blank');
                }}
              >
                <FileText className={styles.fileIcon} weight="duotone" />
                <div className={styles.fileName}>{item.name}</div>
                {item.size && (
                  <div className={styles.fileSize}>{formatFileSize(item.size)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewItem && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewItem(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{previewItem.name}</h3>
              <button className={styles.closeBtn} onClick={() => setPreviewItem(null)}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              {previewItem.thumbnailLink || previewItem.webContentLink ? (
                <img
                  src={getHighResThumbnail(previewItem.thumbnailLink) || previewItem.webContentLink}
                  alt={previewItem.name}
                  className={styles.previewImage}
                />
              ) : (
                <p>No preview available for this file.</p>
              )}

              <div className={styles.modalActions}>
                {previewItem.webViewLink && (
                  <a
                    href={previewItem.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.actionBtn}
                  >
                    View on Google Drive <ArrowUpRight size={14} />
                  </a>
                )}
                {previewItem.webContentLink && (
                  <a
                    href={previewItem.webContentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.actionBtn}
                  >
                    Download File <Download size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
