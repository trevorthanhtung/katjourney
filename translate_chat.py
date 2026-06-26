import json
import os

chat_translations = {
    "vi": {
        "title": "Trò Chuyện Nhóm",
        "emptyTitle": "Chưa có tin nhắn nào",
        "emptySubtitle": "Hãy là người đầu tiên gửi lời chào trong nhóm trò chuyện!",
        "inputPlaceholder": "Nhập tin nhắn...",
        "connectedAs": "Bạn đang kết nối dưới tên:",
        "openBtn": "Mở cuộc trò chuyện"
    },
    "en": {
        "title": "Group Chat",
        "emptyTitle": "No messages yet",
        "emptySubtitle": "Be the first to say hello in the chat group!",
        "inputPlaceholder": "Enter message...",
        "connectedAs": "You are connected as:",
        "openBtn": "Open chat"
    },
    "zh": {
        "title": "群聊",
        "emptyTitle": "暂无消息",
        "emptySubtitle": "成为第一个在群聊中打招呼的人吧！",
        "inputPlaceholder": "输入消息...",
        "connectedAs": "您的连接身份是:",
        "openBtn": "打开聊天"
    },
    "es": {
        "title": "Chat Grupal",
        "emptyTitle": "Aún no hay mensajes",
        "emptySubtitle": "¡Sé el primero en saludar en el chat grupal!",
        "inputPlaceholder": "Escribe un mensaje...",
        "connectedAs": "Estás conectado como:",
        "openBtn": "Abrir chat"
    },
    "ja": {
        "title": "グループチャット",
        "emptyTitle": "まだメッセージはありません",
        "emptySubtitle": "グループチャットで最初に挨拶してみましょう！",
        "inputPlaceholder": "メッセージを入力...",
        "connectedAs": "接続名:",
        "openBtn": "チャットを開く"
    },
    "pt": {
        "title": "Chat de Grupo",
        "emptyTitle": "Sem mensagens ainda",
        "emptySubtitle": "Seja o primeiro a dizer olá no grupo de chat!",
        "inputPlaceholder": "Digite uma mensagem...",
        "connectedAs": "Você está conectado como:",
        "openBtn": "Abrir chat"
    },
    "ko": {
        "title": "그룹 채팅",
        "emptyTitle": "아직 메시지가 없습니다",
        "emptySubtitle": "채팅 그룹에서 먼저 인사해 보세요!",
        "inputPlaceholder": "메시지 입력...",
        "connectedAs": "현재 접속 이름:",
        "openBtn": "채팅 열기"
    },
    "th": {
        "title": "แชทกลุ่ม",
        "emptyTitle": "ยังไม่มีข้อความ",
        "emptySubtitle": "เป็นคนแรกที่ทักทายในแชทกลุ่ม!",
        "inputPlaceholder": "ป้อนข้อความ...",
        "connectedAs": "คุณเชื่อมต่อในชื่อ:",
        "openBtn": "เปิดแชท"
    },
    "de": {
        "title": "Gruppenchat",
        "emptyTitle": "Noch keine Nachrichten",
        "emptySubtitle": "Seien Sie der Erste, der im Gruppenchat Hallo sagt!",
        "inputPlaceholder": "Nachricht eingeben...",
        "connectedAs": "Verbunden als:",
        "openBtn": "Chat öffnen"
    },
    "fr": {
        "title": "Discussion de groupe",
        "emptyTitle": "Aucun message pour l'instant",
        "emptySubtitle": "Soyez le premier à dire bonjour dans le groupe de discussion !",
        "inputPlaceholder": "Entrez un message...",
        "connectedAs": "Vous êtes connecté en tant que :",
        "openBtn": "Ouvrir la discussion"
    },
    "ru": {
        "title": "Групповой чат",
        "emptyTitle": "Пока нет сообщений",
        "emptySubtitle": "Станьте первым, кто поздоровается в чате!",
        "inputPlaceholder": "Введите сообщение...",
        "connectedAs": "Вы подключены как:",
        "openBtn": "Открыть чат"
    },
    "ar": {
        "title": "دردشة جماعية",
        "emptyTitle": "لا توجد رسائل بعد",
        "emptySubtitle": "كن أول من يلقي التحية في مجموعة الدردشة!",
        "inputPlaceholder": "أدخل رسالة...",
        "connectedAs": "أنت متصل كـ:",
        "openBtn": "افتح الدردشة"
    }
}

# we also need "Người tạo chuyến đi" for the chatName. Let's put it in the "roles" object or "chat". Let's put it in "chat.tripCreator".
for lang, trans in chat_translations.items():
    if lang == "vi": trans["tripCreator"] = "Người tạo chuyến đi"
    elif lang == "en": trans["tripCreator"] = "Trip Creator"
    elif lang == "zh": trans["tripCreator"] = "行程创建者"
    elif lang == "es": trans["tripCreator"] = "Creador del Viaje"
    elif lang == "ja": trans["tripCreator"] = "旅の作成者"
    elif lang == "pt": trans["tripCreator"] = "Criador da Viagem"
    elif lang == "ko": trans["tripCreator"] = "여행 생성자"
    elif lang == "th": trans["tripCreator"] = "ผู้สร้างการเดินทาง"
    elif lang == "de": trans["tripCreator"] = "Reiseersteller"
    elif lang == "fr": trans["tripCreator"] = "Créateur du voyage"
    elif lang == "ru": trans["tripCreator"] = "Создатель поездки"
    elif lang == "ar": trans["tripCreator"] = "منشئ الرحلة"

def translate_chat():
    locales_dir = "src/locales"
    for lang, trans in chat_translations.items():
        filepath = os.path.join(locales_dir, f"{lang}.json")
        if not os.path.exists(filepath):
            trans = chat_translations["en"]
            
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            if "chat" not in data:
                data["chat"] = {}
                
            for k, v in trans.items():
                data["chat"][k] = v
                
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            pass

if __name__ == "__main__":
    translate_chat()
