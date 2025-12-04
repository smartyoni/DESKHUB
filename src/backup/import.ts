import { closeDatabase, initializeSqlite } from '../db/init';

/**
 * 파일 선택 다이얼로그를 열고 사용자가 선택한 파일 반환
 */
function openFileDialog(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.db';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      resolve(file || null);
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}

/**
 * OPFS의 DB 파일을 새 파일로 덮어쓰기
 */
async function replaceOPFSFile(blob: Blob): Promise<boolean> {
  try {
    console.log('📝 OPFS 파일 덮어쓰기 중...');

    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('deskhub.db', { create: true });

    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();

    console.log('✅ OPFS 파일 덮어쓰기 완료');
    return true;
  } catch (error) {
    console.error('❌ OPFS 파일 덮어쓰기 실패:', error);
    return false;
  }
}

/**
 * 백업 파일을 선택하고 복원
 */
export async function importBackup(): Promise<boolean> {
  try {
    // 1. 파일 선택
    const file = await openFileDialog();
    if (!file) {
      console.log('⚠️ 파일 선택 취소');
      return false;
    }

    console.log(`📤 파일 가져오기: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // 2. 확인 모달
    const proceed = confirm(
      `${file.name}으로 복원하시겠습니까?\n\n현재 데이터가 영구적으로 덮어쓰여집니다.`
    );

    if (!proceed) {
      console.log('⚠️ 복원 취소');
      return false;
    }

    // 3. DB 연결 종료
    closeDatabase();

    // 4. OPFS 파일 덮어쓰기
    const success = await replaceOPFSFile(file);
    if (!success) {
      return false;
    }

    // 5. DB 재연결
    await initializeSqlite();

    console.log('✅ 복원 완료, 페이지를 새로고침합니다...');

    // 6. 페이지 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 1000);

    return true;
  } catch (error) {
    console.error('❌ 복원 실패:', error);
    alert('복원 중 오류가 발생했습니다: ' + (error as Error).message);
    return false;
  }
}

/**
 * 최근 백업 후 경과 시간 계산
 */
export function getDaysSinceLastBackup(): number {
  const lastBackupStr = localStorage.getItem('last_backup_date');
  if (!lastBackupStr) return Infinity;

  const lastBackup = parseInt(lastBackupStr);
  const now = Date.now();
  const daysSince = (now - lastBackup) / (1000 * 60 * 60 * 24);

  return daysSince;
}

/**
 * 백업 권장 알림 (7일마다)
 */
export function checkBackupReminder(): boolean {
  const daysSince = getDaysSinceLastBackup();

  if (daysSince > 7) {
    console.warn('⚠️ 마지막 백업 후 7일이 지났습니다. 백업을 권장합니다!');
    return true;
  }

  return false;
}
