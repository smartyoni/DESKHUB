import { executeQuery, executeUpdate, queryOne } from '../schema';

export interface Bookmark {
  id: string;
  zone_id: number;
  name: string;
  url: string;
  color?: string;
  created_at: string;
}

/**
 * 구역별 북마크 조회
 */
export function getBookmarksByZone(zoneId: number): Bookmark[] {
  return executeQuery(
    'SELECT * FROM bookmarks WHERE zone_id = ? ORDER BY CAST(SUBSTR(id, 4) AS INTEGER)',
    [zoneId]
  );
}

/**
 * 모든 북마크 조회
 */
export function getAllBookmarks(): Bookmark[] {
  return executeQuery(
    'SELECT * FROM bookmarks ORDER BY zone_id, CAST(SUBSTR(id, 4) AS INTEGER)'
  );
}

/**
 * 북마크 단일 조회
 */
export function getBookmark(id: string): Bookmark | null {
  return queryOne('SELECT * FROM bookmarks WHERE id = ?', [id]);
}

/**
 * 북마크 생성
 */
export function createBookmark(bookmark: Bookmark): void {
  executeUpdate(
    `INSERT INTO bookmarks (id, zone_id, name, url, color, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      bookmark.id,
      bookmark.zone_id,
      bookmark.name,
      bookmark.url,
      bookmark.color || null,
      bookmark.created_at,
    ]
  );
}

/**
 * 북마크 업데이트
 */
export function updateBookmark(bookmark: Partial<Bookmark> & { id: string }): void {
  const updates: string[] = [];
  const values: any[] = [];

  if (bookmark.name !== undefined) {
    updates.push('name = ?');
    values.push(bookmark.name);
  }
  if (bookmark.url !== undefined) {
    updates.push('url = ?');
    values.push(bookmark.url);
  }
  if (bookmark.zone_id !== undefined) {
    updates.push('zone_id = ?');
    values.push(bookmark.zone_id);
  }
  if (bookmark.color !== undefined) {
    updates.push('color = ?');
    values.push(bookmark.color);
  }

  if (updates.length === 0) return;

  values.push(bookmark.id);
  executeUpdate(
    `UPDATE bookmarks SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * 북마크 삭제
 */
export function deleteBookmark(id: string): void {
  executeUpdate('DELETE FROM bookmarks WHERE id = ?', [id]);
}

/**
 * 여러 북마크 일괄 생성
 */
export function insertBookmarksBatch(bookmarks: Bookmark[]): void {
  bookmarks.forEach(bm => createBookmark(bm));
}
