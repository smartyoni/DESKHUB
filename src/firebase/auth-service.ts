import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './config';

/**
 * 익명 로그인
 */
export async function loginAnonymously(): Promise<User> {
  try {
    console.log('🔐 익명 로그인 시도...');
    const result = await signInAnonymously(auth);
    console.log('✅ 익명 로그인 성공:', result.user.uid);
    return result.user;
  } catch (error) {
    console.error('❌ 익명 로그인 실패:', error);
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
