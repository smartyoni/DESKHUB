/**
 * OPFS 파일 I/O 및 Blob 변환 테스트
 * Phase 1: 기술 검증용 테스트 코드
 */

/**
 * 테스트 1: OPFS에 파일 쓰기
 */
export async function testOPFSWrite() {
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('test.db', { create: true });
    const writable = await fileHandle.createWritable();

    const testData = new TextEncoder().encode('Test SQLite data');
    await writable.write(testData);
    await writable.close();

    console.log('✅ OPFS 쓰기 성공');
    return true;
  } catch (error) {
    console.error('❌ OPFS 쓰기 실패:', error);
    return false;
  }
}

/**
 * 테스트 2: OPFS에서 파일 읽기
 */
export async function testOPFSRead() {
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('test.db');
    const file = await fileHandle.getFile();

    const text = await file.text();
    console.log('✅ OPFS 읽기 성공:', text);
    return true;
  } catch (error) {
    console.error('❌ OPFS 읽기 실패:', error);
    return false;
  }
}

/**
 * 테스트 3: OPFS 파일을 Blob으로 변환
 */
export async function testOPFSToBlob() {
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle('test.db');
    const file = await fileHandle.getFile(); // File은 Blob의 서브타입

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/x-sqlite3' });

    console.log('✅ Blob 변환 성공, 크기:', blob.size, 'bytes');
    return blob;
  } catch (error) {
    console.error('❌ Blob 변환 실패:', error);
    return null;
  }
}

/**
 * 테스트 4: Blob을 파일로 다운로드
 */
export async function testBlobDownload(blob: Blob) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deskhub-test-${Date.now()}.db`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('✅ 파일 다운로드 시작');
    return true;
  } catch (error) {
    console.error('❌ 파일 다운로드 실패:', error);
    return false;
  }
}

/**
 * 테스트 5: 파일 선택 및 OPFS에 덮어쓰기
 */
export async function testFileImport() {
  return new Promise<boolean>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.db';

    input.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          console.log('❌ 파일 선택 취소');
          resolve(false);
          return;
        }

        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle('test.db', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();

        console.log('✅ 파일 가져오기 성공:', file.name);
        resolve(true);
      } catch (error) {
        console.error('❌ 파일 가져오기 실패:', error);
        resolve(false);
      }
    };

    input.click();
  });
}

/**
 * 테스트 6: OPFS 저장소 사용량 확인
 */
export async function testStorageEstimate() {
  try {
    if (!navigator.storage?.estimate) {
      console.warn('⚠️ Storage Quota API 미지원');
      return null;
    }

    const estimate = await navigator.storage.estimate();
    const usagePercent = (estimate.usage! / estimate.quota!) * 100;

    console.log('✅ 저장소 정보:');
    console.log(`   사용: ${(estimate.usage! / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   제한: ${(estimate.quota! / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   사용률: ${usagePercent.toFixed(1)}%`);

    return estimate;
  } catch (error) {
    console.error('❌ 저장소 확인 실패:', error);
    return null;
  }
}

/**
 * 모든 테스트 실행
 */
export async function runAllTests() {
  console.log('🧪 OPFS 파일 I/O 테스트 시작...\n');

  // 테스트 1: 쓰기
  const writeOk = await testOPFSWrite();
  if (!writeOk) return;

  // 테스트 2: 읽기
  const readOk = await testOPFSRead();
  if (!readOk) return;

  // 테스트 3: Blob 변환
  const blob = await testOPFSToBlob();
  if (!blob) return;

  // 테스트 4: 다운로드
  await testBlobDownload(blob);

  // 테스트 5: 가져오기
  const importOk = await testFileImport();
  if (!importOk) console.log('(파일 가져오기는 선택적)');

  // 테스트 6: 저장소
  await testStorageEstimate();

  console.log('\n✅ Phase 1 기술 검증 완료!');
}
