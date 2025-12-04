import { getDatabase } from '../db/init';
import { createSchema, beginTransaction, commitTransaction, rollbackTransaction } from '../db/schema';
import { createZone, initializeZones } from '../db/dao/zones';
import { insertBookmarksBatch } from '../db/dao/bookmarks';
import { createProject } from '../db/dao/projects';
import { createCategory, createItem } from '../db/dao/archive';
import { createJournal } from '../db/dao/journals';

/**
 * LocalStorage의 데이터 타입 정의
 */
interface LocalStorageData {
  zones?: any[];
  bookmarks?: any[];
  projects?: any[];
  archiveCats?: any[];
  archiveItems?: any[];
  journals?: any[];
}

/**
 * LocalStorage에서 모든 데이터 읽기
 */
function readFromLocalStorage(): LocalStorageData {
  const data: LocalStorageData = {};

  const keys = ['sbs_zones', 'sbs_bookmarks', 'sbs_projects', 'sbs_archive_cats', 'sbs_archive_items', 'sbs_journals'];

  keys.forEach(key => {
    const stored = localStorage.getItem(key);
    if (stored) {
      const fieldName = key.replace('sbs_', '') as keyof LocalStorageData;
      try {
        data[fieldName] = JSON.parse(stored);
      } catch (error) {
        console.warn(`⚠️ ${key} 파싱 실패:`, error);
      }
    }
  });

  return data;
}

/**
 * 마이그레이션 실행
 */
export async function runMigration(): Promise<boolean> {
  const db = getDatabase();

  try {
    console.log('\n🚀 LocalStorage → SQLite 마이그레이션 시작...\n');

    // 1. LocalStorage 데이터 읽기
    console.log('📖 LocalStorage에서 데이터 읽기...');
    const localData = readFromLocalStorage();

    // 2. 스키마 생성
    console.log('📋 SQLite 스키마 생성...');
    await createSchema();

    // 3. 트랜잭션 시작
    console.log('🔄 트랜잭션 시작...');
    beginTransaction();

    try {
      // 4. Zones 마이그레이션
      if (localData.zones && localData.zones.length > 0) {
        console.log(`📌 Zones 마이그레이션: ${localData.zones.length}개`);
        localData.zones.forEach(zone => {
          createZone({ id: zone.index, name: zone.name });
        });
      } else {
        console.log('📌 Zones 초기화...');
        initializeZones();
      }

      // 5. Bookmarks 마이그레이션
      if (localData.bookmarks && localData.bookmarks.length > 0) {
        console.log(`📚 Bookmarks 마이그레이션: ${localData.bookmarks.length}개`);
        const bookmarks = localData.bookmarks.map((bm: any) => ({
          id: bm.id,
          zone_id: bm.zoneIndex,
          name: bm.name,
          url: bm.url,
          color: bm.color,
          created_at: new Date().toISOString(),
        }));
        insertBookmarksBatch(bookmarks);
      }

      // 6. Projects 마이그레이션
      if (localData.projects && localData.projects.length > 0) {
        console.log(`📋 Projects 마이그레이션: ${localData.projects.length}개`);
        localData.projects.forEach((proj: any) => {
          const checklist = (proj.checklist || []).map((item: any, idx: number) => ({
            id: item.id,
            text: item.text,
            isChecked: item.isChecked || false,
            order: idx,
          }));

          createProject({
            id: proj.id,
            title: proj.title,
            status: proj.status || 'Ready',
            deadline: proj.deadline || new Date().toISOString().split('T')[0],
            created_at: proj.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            checklist,
          });
        });
      }

      // 7. Archive Categories 마이그레이션
      if (localData.archiveCats && localData.archiveCats.length > 0) {
        console.log(`🗂️  Archive Categories 마이그레이션: ${localData.archiveCats.length}개`);
        localData.archiveCats.forEach((cat: any) => {
          createCategory({
            id: cat.id,
            name: cat.name,
            created_at: new Date().toISOString(),
          });
        });
      }

      // 8. Archive Items 마이그레이션
      if (localData.archiveItems && localData.archiveItems.length > 0) {
        console.log(`📄 Archive Items 마이그레이션: ${localData.archiveItems.length}개`);
        localData.archiveItems.forEach((item: any) => {
          createItem({
            id: item.id,
            category_id: item.categoryId,
            title: item.title,
            content: item.content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      }

      // 9. Journal Entries 마이그레이션
      if (localData.journals && localData.journals.length > 0) {
        console.log(`📔 Journal Entries 마이그레이션: ${localData.journals.length}개`);
        localData.journals.forEach((journal: any) => {
          const checklist = (journal.checklist || []).map((item: any, idx: number) => ({
            id: item.id,
            text: item.text,
            isChecked: item.isChecked || false,
            order: idx,
          }));

          createJournal({
            id: journal.id,
            date: journal.date,
            content: journal.content,
            summary1: journal.summary1,
            summary2: journal.summary2,
            summary3: journal.summary3,
            created_at: journal.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            checklist,
          });
        });
      }

      // 10. 트랜잭션 커밋
      console.log('✅ 트랜잭션 커밋...');
      commitTransaction();

      // 11. 마이그레이션 플래그 설정
      localStorage.setItem('sbs_migration_completed', 'true');
      localStorage.setItem('sbs_migration_date', new Date().toISOString());

      console.log('\n✅ 마이그레이션 완료!\n');
      return true;
    } catch (error) {
      console.error('❌ 마이그레이션 중 오류 발생, 롤백...');
      rollbackTransaction();
      throw error;
    }
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    return false;
  }
}

/**
 * 마이그레이션 필요 여부 확인
 */
export function isMigrationNeeded(): boolean {
  return localStorage.getItem('sbs_migration_completed') !== 'true';
}

/**
 * 마이그레이션 상태 조회
 */
export function getMigrationStatus() {
  const completed = localStorage.getItem('sbs_migration_completed') === 'true';
  const date = localStorage.getItem('sbs_migration_date');

  return {
    completed,
    date: date ? new Date(date) : null,
  };
}
