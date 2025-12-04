import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './config';

/**
 * 현재 사용자 ID 가져오기
 * (익명 로그인 가정)
 */
function getUserId(): string {
  if (!auth.currentUser) {
    throw new Error('사용자가 로그인하지 않았습니다');
  }
  return auth.currentUser.uid;
}

/**
 * 단일 문서 저장/업데이트 (병합)
 */
export async function saveDocument(
  collectionName: string,
  docId: string,
  data: any
): Promise<void> {
  const userId = getUserId();
  const docRef = doc(db, `users/${userId}/${collectionName}`, docId);
  await setDoc(docRef, { ...data, updatedAt: new Date() }, { merge: true });
}

/**
 * 단일 문서 가져오기
 */
export async function getDocument(
  collectionName: string,
  docId: string
): Promise<any | null> {
  const userId = getUserId();
  const docRef = doc(db, `users/${userId}/${collectionName}`, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

/**
 * 전체 컬렉션 가져오기
 */
export async function getAllDocuments(collectionName: string): Promise<any[]> {
  const userId = getUserId();
  const collectionRef = collection(db, `users/${userId}/${collectionName}`);
  const querySnapshot = await getDocs(collectionRef);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * 문서 삭제
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const userId = getUserId();
  const docRef = doc(db, `users/${userId}/${collectionName}`, docId);
  await deleteDoc(docRef);
}

/**
 * 배치 저장 (여러 문서 한 번에)
 */
export async function saveDocumentBatch(
  collectionName: string,
  documents: any[]
): Promise<void> {
  const userId = getUserId();
  const promises = documents.map((doc) =>
    setDoc(
      doc(db, `users/${userId}/${collectionName}`, doc.id),
      { ...doc, updatedAt: new Date() },
      { merge: true }
    )
  );
  await Promise.all(promises);
}

/**
 * 실시간 구독 (단일 컬렉션)
 */
export function subscribeToCollection(
  collectionName: string,
  callback: (data: any[]) => void
): Unsubscribe {
  const userId = getUserId();
  const collectionRef = collection(db, `users/${userId}/${collectionName}`);

  return onSnapshot(collectionRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(data);
  });
}

/**
 * 데이터 동기화 상태
 */
export let isSyncing = false;

export function setIsSyncing(value: boolean): void {
  isSyncing = value;
}

console.log('✅ Firestore 유틸리티 로드됨');
