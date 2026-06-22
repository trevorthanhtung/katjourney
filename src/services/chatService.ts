import { supabase } from '../lib/supabase';
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
  // Guest cần session (anonymous) để RLS cho phép INSERT
  const { data: { session } } = await supabase.auth.getSession();
  let user = session?.user;
  if (!user) {
    // Thử đăng nhập ẩn danh nếu chưa có session
    const { data: anonData, error: anonErr } = await supabase.auth.signInAnonymously();
    if (anonErr || !anonData?.user) {
      throw new Error("Vui lòng đăng nhập hoặc mở link chia sẻ hợp lệ trước khi nhắn tin.");
    }
    user = anonData.user;
  }

  const { error } = await supabase
    .from('messages')
    .insert({
      share_token: token,
      text: text.trim(),
      sender_id: user.id,
      sender_name: identity.name,
      sender_role: identity.role || (identity.canEdit ? "Thành viên" : "Khách"),
      sender_avatar: avatar || null
    });

  if (error) {
    throw new Error("Không thể gửi tin nhắn: " + error.message);
  }
}

export async function subscribeToMessages(
  token: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: any) => void
) {
  // 1. Fetch initial 100 messages
  const { data: initialData, error: fetchError } = await supabase
    .from('messages')
    .select('*')
    .eq('share_token', token)
    .order('created_at', { ascending: true })
    .limit(100);

  if (fetchError) {
    console.error("Lỗi khi tải tin nhắn ban đầu:", fetchError);
    if (onError) onError(fetchError);
    return () => {};
  }

  let currentMessages: ChatMessage[] = (initialData || []).map((d: any) => ({
    id: d.id,
    text: d.text,
    senderId: d.sender_id,
    senderName: d.sender_name,
    senderRole: d.sender_role,
    senderAvatar: d.sender_avatar,
    createdAt: d.created_at
  }));

  onUpdate(currentMessages);

  // 2. Subscribe to realtime inserts
  const channel = supabase
    .channel(`messages-${token}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `share_token=eq.${token}`
      },
      (payload) => {
        const newItem = payload.new as any;
        if (!newItem) return;

        const mapped: ChatMessage = {
          id: newItem.id,
          text: newItem.text,
          senderId: newItem.sender_id,
          senderName: newItem.sender_name,
          senderRole: newItem.sender_role,
          senderAvatar: newItem.sender_avatar,
          createdAt: newItem.created_at
        };

        // Check if message already exists in list (avoid duplicate rendering)
        if (!currentMessages.some(m => m.id === mapped.id)) {
          currentMessages = [...currentMessages, mapped];
          onUpdate(currentMessages);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
