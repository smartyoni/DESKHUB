/**
 * 로그인 기능 제거 - 고정 UID 시스템 사용
 * 각 기기별로 고유한 ID를 생성하여 Firestore에 저장
 */

/**
 * 기기별 고유 ID 생성 및 획득
 * (localStorage에 저장되므로 같은 기기에서는 항상 같은 ID)
 */
export function getAppUserId(): string {
  let userId = localStorage.getItem('app_user_id');

  if (!userId) {
    // 새로운 ID 생성 (타임스탬프 + 랜덤)
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('app_user_id', userId);
    console.log('✅ 새로운 기기 ID 생성:', userId);
  } else {
    console.log('✅ 기존 기기 ID 사용:', userId);
  }

  return userId;
}

/**
 * Firebase 초기화 (로그인 필요 없음)
 */
export async function initializeApp(): Promise<void> {
  try {
    console.log('🚀 앱 초기화 시작...');
    const userId = getAppUserId();
    console.log('📱 기기 ID:', userId);
    console.log('✅ 앱 준비 완료');
  } catch (error: any) {
    console.error('❌ 앱 초기화 실패:', error.message);
    throw error;
  }
}

console.log('✅ Firebase 인증 서비스 로드됨');
