import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

let db: any = null;
let sqlite3: any = null;

/**
 * 브라우저의 종류 및 버전 감지
 */
function getBrowserInfo() {
  const ua = navigator.userAgent;

  // Safari 감지
  if (/^((?!chrome|android).)*safari/i.test(ua)) {
    const version = ua.match(/version\/([\d.]+)/i);
    return {
      name: 'Safari',
      version: version ? parseInt(version[1]) : 0,
    };
  }

  // Chrome 감지
  if (/chrome/i.test(ua)) {
    const version = ua.match(/chrome\/([\d.]+)/i);
    return {
      name: 'Chrome',
      version: version ? parseInt(version[1]) : 0,
    };
  }

  // Firefox 감지
  if (/firefox/i.test(ua)) {
    const version = ua.match(/firefox\/([\d.]+)/i);
    return {
      name: 'Firefox',
      version: version ? parseInt(version[1]) : 0,
    };
  }

  return { name: 'Unknown', version: 0 };
}

/**
 * Incognito 모드 감지
 */
async function detectIncognito(): Promise<boolean> {
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('__incognito_test__', { create: true });
    await fileHandle.remove();
    return false; // 정상적으로 삭제됨 = Incognito 아님
  } catch {
    return true; // 오류 발생 = Incognito 모드
  }
}

/**
 * VFS (Virtual File System) 선택
 *
 * GitHub Pages는 COOP/COEP 헤더가 없으므로 opfs-sahpool 사용
 * opfs-sahpool은 SharedArrayBuffer를 필요로 하지 않음
 */
async function selectVFS(): Promise<string> {
  const browser = getBrowserInfo();
  const isIncognito = await detectIncognito();

  console.log(`🌐 브라우저: ${browser.name} v${browser.version}`);
  console.log(`🔒 Incognito: ${isIncognito ? '활성화' : '비활성화'}`);

  // Incognito 모드: IndexedDB 사용
  if (isIncognito) {
    console.log('📌 VFS 선택: idb (IndexedDB - Incognito 모드)');
    return 'idb';
  }

  // Safari: opfs-sahpool (SharedArrayBuffer 불필요)
  if (browser.name === 'Safari') {
    console.log('📌 VFS 선택: opfs-sahpool (Safari - SharedArrayBuffer 불필요)');
    return 'opfs-sahpool';
  }

  // Chrome, Firefox: opfs-sahpool (GitHub Pages 호환)
  console.log('📌 VFS 선택: opfs-sahpool (OPFS - GitHub Pages 호환)');
  return 'opfs-sahpool';
}

/**
 * SQLite WASM 초기화
 */
export async function initializeSqlite() {
  if (db) {
    console.log('✅ SQLite는 이미 초기화됨');
    return db;
  }

  try {
    console.log('🔧 SQLite WASM 초기화 중...');

    // 1. SQLite WASM 모듈 로드
    sqlite3 = await sqlite3InitModule({
      print: console.log,
      printErr: console.error,
    });

    console.log(`✅ SQLite WASM 로드됨: v${sqlite3.version.libVersion}`);

    // 2. VFS 선택
    const vfs = await selectVFS();

    // 3. DB 파일 열기
    const filename = '/deskhub.db';
    console.log(`📂 DB 파일: ${filename}`);

    // VFS에 따른 DB 초기화
    if (vfs === 'idb') {
      // IndexedDB 모드
      const Db = sqlite3.oo1.DB;
      db = new Db({ filename, vfs: 'idb' });
    } else {
      // OPFS 모드 (opfs-sahpool)
      const Db = sqlite3.oo1.DB;
      db = new Db({ filename, vfs });
    }

    console.log('✅ SQLite DB 연결 성공');

    // 4. 초기 설정
    db.exec('PRAGMA journal_mode=WAL;');
    db.exec('PRAGMA locking_mode=EXCLUSIVE;');

    console.log('✅ SQLite 초기화 완료\n');
    return db;
  } catch (error) {
    console.error('❌ SQLite 초기화 실패:', error);
    throw error;
  }
}

/**
 * DB 연결 종료
 */
export function closeDatabase() {
  if (db) {
    try {
      db.close();
      db = null;
      console.log('✅ DB 연결 종료');
    } catch (error) {
      console.error('❌ DB 종료 실패:', error);
    }
  }
}

/**
 * 현재 DB 인스턴스 반환
 */
export function getDatabase() {
  if (!db) {
    throw new Error('SQLite가 초기화되지 않았습니다. initializeSqlite()를 먼저 호출하세요.');
  }
  return db;
}

/**
 * DB 상태 확인
 */
export function isDatabaseReady(): boolean {
  return db !== null;
}

/**
 * WAL 체크포인트 (백업 전 필수)
 */
export async function checkpointWAL() {
  if (!db) return;

  try {
    db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
    console.log('✅ WAL 체크포인트 완료');
  } catch (error) {
    console.error('❌ WAL 체크포인트 실패:', error);
  }
}
