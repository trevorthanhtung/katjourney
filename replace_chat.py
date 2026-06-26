import re

def replace_chat():
    filepath = "src/features/share/components/ChatBox.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Ensure useTranslation is imported
    if "useTranslation" not in content:
        content = content.replace(
            'import { useLiveQuery } from "dexie-react-hooks";',
            'import { useLiveQuery } from "dexie-react-hooks";\nimport { useTranslation } from "react-i18next";'
        )
        if "useTranslation" not in content:
            content = content.replace(
                'import { useEffect, useRef, useState } from "react";',
                'import { useEffect, useRef, useState } from "react";\nimport { useTranslation } from "react-i18next";'
            )

    content = content.replace(
        'export function ChatBox({ token, currentUser }: ChatBoxProps) {',
        'export function ChatBox({ token, currentUser }: ChatBoxProps) {\n  const { t } = useTranslation();'
    )
    
    # Replace strings in ChatBox.tsx
    content = content.replace('Hãy là người đầu tiên gửi lời chào trong nhóm trò chuyện!</p>', '{t("chat.emptySubtitle")}</p>')
    content = content.replace('>Chưa có tin nhắn nào</h3>', '>{t("chat.emptyTitle")}</h3>')
    content = content.replace('placeholder="Nhập tin nhắn..."', 'placeholder={t("chat.inputPlaceholder")}')
    content = content.replace('>Trò Chuyện Nhóm</h4>', '>{t("chat.title")}</h4>')
    content = content.replace('Bạn đang kết nối dưới tên:', '{t("chat.connectedAs")}')
    content = content.replace('>Mở cuộc trò chuyện</button>', '>{t("chat.openBtn")}</button>')
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

def replace_morescreen():
    filepath = "src/features/more/MoreScreen.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # The scope here is the MoreScreen component which already has useTranslation() inside.
    # But wait, `renderChatBox` is a function prop inside the component's JSX:
    # renderChatBox={trip.shareToken ? () => { ... }}
    # so we can use `t` from the MoreScreen scope.
    content = content.replace('let chatName = "Người tạo chuyến đi";', 'let chatName = t("chat.tripCreator");')
    content = content.replace('let chatRole = "Người tạo chuyến đi";', 'let chatRole = t("chat.tripCreator");')
    content = content.replace('chatRole = "Người tạo chuyến đi";', 'chatRole = t("chat.tripCreator");')

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

if __name__ == "__main__":
    replace_chat()
    replace_morescreen()
