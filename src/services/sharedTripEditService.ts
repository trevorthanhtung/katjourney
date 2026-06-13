import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { initFirebase, ensureAnonymousUser } from '../lib/firebase';

export async function addSharedDocument(token: string, collectionName: string, id: string, payload: any) {
  const user = await ensureAnonymousUser();
  const { db } = await initFirebase();
  const timestamp = serverTimestamp();
  
  const docRef = doc(db, 'publicShares', token, collectionName, id);
  await setDoc(docRef, {
    ...payload,
    id: id.includes('-') ? id : Number(id), // Support both string and number IDs depending on component implementation
    createdAt: timestamp,
    updatedAt: timestamp,
    createdByUid: user.uid,
    updatedByUid: user.uid
  });
}

export async function updateSharedDocument(token: string, collectionName: string, id: string, payload: any) {
  const user = await ensureAnonymousUser();
  const { db } = await initFirebase();
  const timestamp = serverTimestamp();
  
  const docRef = doc(db, 'publicShares', token, collectionName, id);
  await updateDoc(docRef, {
    ...payload,
    updatedAt: timestamp,
    updatedByUid: user.uid
  });
}

export async function deleteSharedDocument(token: string, collectionName: string, id: string) {
  await ensureAnonymousUser();
  const { db } = await initFirebase();
  
  const docRef = doc(db, 'publicShares', token, collectionName, id);
  await deleteDoc(docRef);
}
