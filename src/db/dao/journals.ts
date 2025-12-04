import { executeQuery, executeUpdate, queryOne } from '../schema';

export interface ChecklistItem {
  id: string;
  text: string;
  isChecked: boolean;
  order: number;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  summary1?: string;
  summary2?: string;
  summary3?: string;
  created_at: string;
  updated_at: string;
  checklist?: ChecklistItem[];
}

/**
 * 모든 일지 조회
 */
export function getAllJournals(): JournalEntry[] {
  const journals = executeQuery(
    'SELECT * FROM journal_entries ORDER BY date DESC'
  );

  return journals.map(journal => ({
    ...journal,
    checklist: getChecklistItems(journal.id),
  }));
}

/**
 * 날짜 범위별 일지 조회
 */
export function getJournalsByDateRange(startDate: string, endDate: string): JournalEntry[] {
  const journals = executeQuery(
    `SELECT * FROM journal_entries
     WHERE date BETWEEN ? AND ?
     ORDER BY date DESC`,
    [startDate, endDate]
  );

  return journals.map(journal => ({
    ...journal,
    checklist: getChecklistItems(journal.id),
  }));
}

/**
 * 특정 날짜 일지 조회
 */
export function getJournalByDate(date: string): JournalEntry | null {
  const journal = queryOne(
    'SELECT * FROM journal_entries WHERE date = ?',
    [date]
  );

  if (!journal) return null;

  return {
    ...journal,
    checklist: getChecklistItems(journal.id),
  };
}

/**
 * 일지 단일 조회
 */
export function getJournal(id: string): JournalEntry | null {
  const journal = queryOne(
    'SELECT * FROM journal_entries WHERE id = ?',
    [id]
  );

  if (!journal) return null;

  return {
    ...journal,
    checklist: getChecklistItems(journal.id),
  };
}

/**
 * 일지 생성
 */
export function createJournal(journal: JournalEntry): void {
  executeUpdate(
    `INSERT INTO journal_entries (id, date, content, summary1, summary2, summary3, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      journal.id,
      journal.date,
      journal.content,
      journal.summary1 || null,
      journal.summary2 || null,
      journal.summary3 || null,
      journal.created_at,
      journal.updated_at,
    ]
  );

  // 체크리스트 항목 추가
  journal.checklist?.forEach(item => {
    addChecklistItem(journal.id, item);
  });
}

/**
 * 일지 업데이트
 */
export function updateJournal(journal: Partial<JournalEntry> & { id: string }): void {
  const updates: string[] = [];
  const values: any[] = [];

  if (journal.content !== undefined) {
    updates.push('content = ?');
    values.push(journal.content);
  }
  if (journal.summary1 !== undefined) {
    updates.push('summary1 = ?');
    values.push(journal.summary1 || null);
  }
  if (journal.summary2 !== undefined) {
    updates.push('summary2 = ?');
    values.push(journal.summary2 || null);
  }
  if (journal.summary3 !== undefined) {
    updates.push('summary3 = ?');
    values.push(journal.summary3 || null);
  }

  if (updates.length === 0 && !journal.checklist) return;

  updates.push('updated_at = ?');
  values.push(new Date().toISOString());

  values.push(journal.id);
  executeUpdate(
    `UPDATE journal_entries SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  // 체크리스트 업데이트
  if (journal.checklist) {
    deleteChecklistItems(journal.id);
    journal.checklist.forEach(item => {
      addChecklistItem(journal.id, item);
    });
  }
}

/**
 * 일지 삭제
 */
export function deleteJournal(id: string): void {
  deleteChecklistItems(id);
  executeUpdate('DELETE FROM journal_entries WHERE id = ?', [id]);
}

/**
 * 체크리스트 항목 추가
 */
function addChecklistItem(journalId: string, item: ChecklistItem): void {
  executeUpdate(
    `INSERT INTO checklist_items (id, parent_type, parent_id, text, is_checked, "order", created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      'journal',
      journalId,
      item.text,
      item.isChecked ? 1 : 0,
      item.order,
      new Date().toISOString(),
    ]
  );
}

/**
 * 체크리스트 항목 조회
 */
function getChecklistItems(journalId: string): ChecklistItem[] {
  return executeQuery(
    `SELECT id, text, is_checked as isChecked, "order" FROM checklist_items
     WHERE parent_type = 'journal' AND parent_id = ?
     ORDER BY "order"`,
    [journalId]
  ).map(item => ({
    ...item,
    isChecked: item.isChecked === 1,
  }));
}

/**
 * 체크리스트 항목 삭제
 */
function deleteChecklistItems(journalId: string): void {
  executeUpdate(
    'DELETE FROM checklist_items WHERE parent_type = ? AND parent_id = ?',
    ['journal', journalId]
  );
}

/**
 * 월별 일지 그룹 조회
 */
export function getJournalsByMonth(yearMonth: string): JournalEntry[] {
  const journals = executeQuery(
    `SELECT * FROM journal_entries
     WHERE SUBSTR(date, 1, 7) = ?
     ORDER BY date DESC`,
    [yearMonth]
  );

  return journals.map(journal => ({
    ...journal,
    checklist: getChecklistItems(journal.id),
  }));
}
