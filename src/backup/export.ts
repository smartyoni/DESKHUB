import { closeDatabase, getDatabase, checkpointWAL } from '../db/init';

/**
 * OPFS에서 DB 파일을 추출하여 Blob으로 반환
 * 백업 전에 WAL 체크포인트를 실행함
 */
export async function exportDatabase(): Promise<Blob> {
  try {
    console.log('📤 백업 추출 시작...');

    // 1. WAL 체크포인트
    await checkpointWAL();

    // 2. DB 연결 종료
    closeDatabase();

    // 3. OPFS에서 파일 읽기
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('deskhub.db');
    const file = await fileHandle.getFile();

    // 4. Blob으로 변환
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/x-sqlite3' });

    console.log(`✅ 백업 추출 완료: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
    return blob;
  } catch (error) {
    console.error('❌ 백업 추출 실패:', error);
    throw error;
  }
}

/**
 * DB 파일을 로컬로 다운로드 (데스크톱)
 */
export async function downloadBackup(blob: Blob): Promise<boolean> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `deskhub-backup-${timestamp}.db`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    console.log(`✅ 파일 다운로드: ${filename}`);
    return true;
  } catch (error) {
    console.error('❌ 파일 다운로드 실패:', error);
    return false;
  }
}

/**
 * Web Share API를 사용하여 파일 공유 (모바일: 카톡/메일/Drive)
 */
export async function shareBackup(blob: Blob): Promise<boolean> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `deskhub-backup-${timestamp}.db`;

    if (!navigator.share) {
      console.log('⚠️ Web Share API 미지원, 다운로드만 가능합니다.');
      return false;
    }

    const file = new File([blob], filename, { type: 'application/x-sqlite3' });

    if (!navigator.canShare({ files: [file] })) {
      console.log('⚠️ 파일 공유 미지원');
      return false;
    }

    await navigator.share({
      title: '데스크허브 백업',
      text: `데스크허브 데이터 백업 파일\n생성: ${new Date().toLocaleString()}`,
      files: [file],
    });

    console.log('✅ 파일 공유 완료');
    return true;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.log('⚠️ 파일 공유 취소');
      return false;
    }
    console.error('❌ 파일 공유 실패:', error);
    return false;
  }
}

/**
 * 전체 백업 프로세스 (추출 + 공유/다운로드)
 */
export async function performBackup(): Promise<boolean> {
  try {
    // 1. 백업 추출
    const blob = await exportDatabase();

    // 2. Web Share API 시도 (모바일)
    const shared = await shareBackup(blob);

    // 3. 공유 실패 시 다운로드 (데스크톱)
    if (!shared) {
      await downloadBackup(blob);
    }

    // 4. 마지막 백업 시간 저장
    localStorage.setItem('last_backup_date', Date.now().toString());

    return true;
  } catch (error) {
    console.error('❌ 백업 실패:', error);
    return false;
  }
}
