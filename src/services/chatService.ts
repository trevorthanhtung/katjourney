import { initFirebase, ensureAnonymousUser } from '../lib/firebase';
import { UserIdentity } from './identityService';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderAvatar?: string;
  createdAt: string;
}

export async function sendMessage(
  token: string,
  text: string,
  identity: UserIdentity,
  avatar?: string
) {
  const user = await ensureAnonymousUser();
  const { db } = await initFirebase();
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

  const messagesRef = collection(db, 'chats', token, 'messages');
  await addDoc(messagesRef, {
    text: text.trim(),
    senderId: user.uid,
    senderName: identity.name,
    senderRole: identity.role || (identity.canEdit ? "Thành viên" : "Khách"),
    senderAvatar: avatar || null,
    createdAt: serverTimestamp()
  });
}

export async function subscribeToMessages(
  token: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: any) => void
) {
  const { db } = await initFirebase();
  const { collection, query, orderBy, onSnapshot, limit } = await import('firebase/firestore');

  const messagesRef = collection(db, 'chats', token, 'messages');
  // Lấy 100 tin nhắn gần nhất
  const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        text: data.text,
        senderId: data.senderId,
        senderName: data.senderName,
        senderRole: data.senderRole,
        senderAvatar: data.senderAvatar,
        // Dùng fallback cho lúc tin nhắn mới gửi lên chưa có timestamp từ server
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });
    onUpdate(messages);
  }, (error) => {
    console.error("Lỗi khi lắng nghe tin nhắn:", error);
    if (onError) onError(error);
  });
}
