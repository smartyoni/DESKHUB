import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './config';

/**
 * 익명 로그인
 */
export async function loginAnonymously(): Promise<User> {
  try {
    console.log('🔐 익명 로그인 시도...');

    // 이미 로그인되어 있으면 현재 사용자 반환
    if (auth.currentUser) {
      console.log('✅ 이미 로그인됨:', auth.currentUser.uid);
      return auth.currentUser;
    }

    const result = await signInAnonymously(auth);
    console.log('✅ 익명 로그인 성공:', result.user.uid);
    console.log('📱 사용자 정보:', {
      uid: result.user.uid,
      isAnonymous: result.user.isAnonymous,
      email: result.user.email,
    });
    return result.user;
  } catch (error: any) {
    console.error('❌ 익명 로그인 실패:');
    console.error('- 에러 코드:', error.code);
    console.error('- 에러 메시지:', error.message);
    console.error('- 전체 에러:', error);
    throw error;
  }
}

/**
 * 인증 상태 모니터링
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * 현재 사용자 확인
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * 사용자가 로그인되어 있는지 확인
 */
export function isUserLoggedIn(): boolean {
  return auth.currentUser !== null;
}

console.log('✅ Firebase 인증 서비스 로드됨');
