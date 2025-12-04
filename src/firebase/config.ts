import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';

// Firebase 설정 (Firebase Console에서 복사)
const firebaseConfig = {
  apiKey: "AIzaSyB8MHKt_DedTncHBU5u8d5AwjJLxqDFP28",
  authDomain: "smartrealapp.firebaseapp.com",
  projectId: "smartrealapp",
  storageBucket: "smartrealapp.firebasestorage.app",
  messagingSenderId: "651193312612",
  appId: "1:651193312612:web:ab8f50c34f8cee37a94671"
};

// Firebase 초기화
export const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스
export const db = getFirestore(app);

// Firebase Authentication
export const auth = getAuth(app);

// 로컬 영속성 설정 (오프라인 지원)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('⚠️ 영속성 설정 실패:', error);
});

console.log('✅ Firebase 초기화 완료');
