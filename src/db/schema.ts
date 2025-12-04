import { getDatabase } from './init';

/**
 * SQLite 스키마 생성
 * LocalStorage의 6개 데이터 타입을 정규화된 테이블로 변환
 */
export async function createSchema() {
  const db = getDatabase();

  try {
    console.log('📋 SQLite 스키마 생성 중...\n');

    // 1. Zones 테이블 (4개 고정)
    db.exec(`
      CREATE TABLE IF NOT EXISTS zones (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );
    `);
    console.log('✅ zones 테이블 생성됨');

    // 2. Bookmarks 테이블 (48개, 12개씩 4개 구역)
    db.exec(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        zone_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        color TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (zone_id) REFERENCES zones(id)
      );
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_bookmarks_zone ON bookmarks(zone_id);');
    console.log('✅ bookmarks 테이블 생성됨');

    // 3. Projects 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Ready', 'InProgress', 'Done')),
        deadline TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);');
    console.log('✅ projects 테이블 생성됨');

    // 4. Checklist Items 테이블 (프로젝트 + 일지 공통)
    db.exec(`
      CREATE TABLE IF NOT EXISTS checklist_items (
        id TEXT PRIMARY KEY,
        parent_type TEXT NOT NULL CHECK(parent_type IN ('project', 'journal')),
        parent_id TEXT NOT NULL,
        text TEXT NOT NULL,
        is_checked INTEGER NOT NULL DEFAULT 0,
        "order" INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_checklist_parent ON checklist_items(parent_type, parent_id);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_checklist_order ON checklist_items("order");');
    console.log('✅ checklist_items 테이블 생성됨');

    // 5. Archive Categories 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS archive_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    console.log('✅ archive_categories 테이블 생성됨');

    // 6. Archive Items 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS archive_items (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES archive_categories(id) ON DELETE CASCADE
      );
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_archive_items_category ON archive_items(category_id);');
    console.log('✅ archive_items 테이블 생성됨');

    // 7. Journal Entries 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        summary1 TEXT,
        summary2 TEXT,
        summary3 TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);');
    db.exec('CREATE INDEX IF NOT EXISTS idx_journal_created_at ON journal_entries(created_at DESC);');
    console.log('✅ journal_entries 테이블 생성됨');

    console.log('\n✅ SQLite 스키마 생성 완료!\n');
  } catch (error) {
    console.error('❌ 스키마 생성 실패:', error);
    throw error;
  }
}

/**
 * 스키마 초기화 (테스트용 - 모든 테이블 삭제)
 */
export async function dropAllTables() {
  const db = getDatabase();

  try {
    console.log('🗑️  모든 테이블 삭제 중...');

    db.exec('DROP TABLE IF EXISTS checklist_items;');
    db.exec('DROP TABLE IF EXISTS bookmarks;');
    db.exec('DROP TABLE IF EXISTS zones;');
    db.exec('DROP TABLE IF EXISTS projects;');
    db.exec('DROP TABLE IF EXISTS archive_items;');
    db.exec('DROP TABLE IF EXISTS archive_categories;');
    db.exec('DROP TABLE IF EXISTS journal_entries;');

    console.log('✅ 모든 테이블 삭제 완료');
  } catch (error) {
    console.error('❌ 테이블 삭제 실패:', error);
    throw error;
  }
}

/**
 * DB 쿼리 실행 헬퍼
 */
export function executeQuery(sql: string, params: any[] = []): any[] {
  const db = getDatabase();
  const result: any[] = [];

  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);

    const columns = stmt.getColumnNames();

    while (stmt.step()) {
      const row: any = {};
      columns.forEach((col, idx) => {
        row[col] = stmt.get(idx);
      });
      result.push(row);
    }

    stmt.finalize();
    return result;
  } catch (error) {
    console.error('❌ 쿼리 실행 실패:', error);
    throw error;
  }
}

/**
 * DB 단일 행 쿼리
 */
export function queryOne(sql: string, params: any[] = []): any | null {
  const results = executeQuery(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * DB 업데이트/삽입/삭제
 */
export function executeUpdate(sql: string, params: any[] = []): void {
  const db = getDatabase();

  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.finalize();
  } catch (error) {
    console.error('❌ 업데이트 실패:', error);
    throw error;
  }
}

/**
 * 트랜잭션 시작
 */
export function beginTransaction(): void {
  const db = getDatabase();
  db.exec('BEGIN TRANSACTION;');
}

/**
 * 트랜잭션 커밋
 */
export function commitTransaction(): void {
  const db = getDatabase();
  db.exec('COMMIT;');
}

/**
 * 트랜잭션 롤백
 */
export function rollbackTransaction(): void {
  const db = getDatabase();
  db.exec('ROLLBACK;');
}
