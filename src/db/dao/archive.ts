import { executeQuery, executeUpdate, queryOne } from '../schema';

export interface ArchiveCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface ArchiveItem {
  id: string;
  category_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

/**
 * 모든 카테고리 조회
 */
export function getAllCategories(): ArchiveCategory[] {
  return executeQuery('SELECT * FROM archive_categories ORDER BY created_at DESC');
}

/**
 * 카테고리 단일 조회
 */
export function getCategory(id: string): ArchiveCategory | null {
  return queryOne('SELECT * FROM archive_categories WHERE id = ?', [id]);
}

/**
 * 카테고리 생성
 */
export function createCategory(category: ArchiveCategory): void {
  executeUpdate(
    `INSERT INTO archive_categories (id, name, created_at)
     VALUES (?, ?, ?)`,
    [category.id, category.name, category.created_at]
  );
}

/**
 * 카테고리 이름 업데이트
 */
export function updateCategoryName(id: string, name: string): void {
  executeUpdate(
    'UPDATE archive_categories SET name = ? WHERE id = ?',
    [name, id]
  );
}

/**
 * 카테고리 삭제 (CASCADE)
 */
export function deleteCategory(id: string): void {
  // 아이템은 FOREIGN KEY CASCADE로 자동 삭제됨
  executeUpdate('DELETE FROM archive_categories WHERE id = ?', [id]);
}

/**
 * 카테고리별 아이템 조회
 */
export function getItemsByCategory(categoryId: string): ArchiveItem[] {
  return executeQuery(
    'SELECT * FROM archive_items WHERE category_id = ? ORDER BY created_at DESC',
    [categoryId]
  );
}

/**
 * 모든 아이템 조회
 */
export function getAllItems(): ArchiveItem[] {
  return executeQuery('SELECT * FROM archive_items ORDER BY category_id, created_at DESC');
}

/**
 * 아이템 단일 조회
 */
export function getItem(id: string): ArchiveItem | null {
  return queryOne('SELECT * FROM archive_items WHERE id = ?', [id]);
}

/**
 * 아이템 생성
 */
export function createItem(item: ArchiveItem): void {
  executeUpdate(
    `INSERT INTO archive_items (id, category_id, title, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.category_id,
      item.title,
      item.content,
      item.created_at,
      item.updated_at,
    ]
  );
}

/**
 * 아이템 업데이트
 */
export function updateItem(item: Partial<ArchiveItem> & { id: string }): void {
  const updates: string[] = [];
  const values: any[] = [];

  if (item.title !== undefined) {
    updates.push('title = ?');
    values.push(item.title);
  }
  if (item.content !== undefined) {
    updates.push('content = ?');
    values.push(item.content);
  }

  if (updates.length === 0) return;

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());

  values.push(item.id);
  executeUpdate(
    `UPDATE archive_items SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
}

/**
 * 아이템 삭제
 */
export function deleteItem(id: string): void {
  executeUpdate('DELETE FROM archive_items WHERE id = ?', [id]);
}

/**
 * 카테고리별 아이템 개수
 */
export function getItemCountByCategory(categoryId: string): number {
  const result = queryOne(
    'SELECT COUNT(*) as count FROM archive_items WHERE category_id = ?',
    [categoryId]
  );
  return result?.count || 0;
}
