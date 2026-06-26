import json
import os

locales_dir = 'src/locales'
translations = {
    "de": {
        "bannerDirectEdit": "Direktbearbeitung",
        "bannerSuggestMode": "Vorschlagsmodus",
        "bannerDirectEditDesc": "Rolle \"{{role}}\": Sie haben die Berechtigung, Ihre zugewiesenen Teile direkt zu bearbeiten.",
        "bannerSuggestModeDesc": "Ihre Änderungen werden dem Reiseinhaber zur Überprüfung gesendet."
    },
    "es": {
        "bannerDirectEdit": "Edición Directa",
        "bannerSuggestMode": "Modo Sugerencia",
        "bannerDirectEditDesc": "Rol \"{{role}}\": Tienes permiso para editar directamente las partes asignadas.",
        "bannerSuggestModeDesc": "Tus cambios se enviarán al propietario del viaje para su revisión."
    },
    "fr": {
        "bannerDirectEdit": "Édition Directe",
        "bannerSuggestMode": "Mode Suggestion",
        "bannerDirectEditDesc": "Rôle \"{{role}}\" : Vous avez l'autorisation d'éditer directement vos parties assignées.",
        "bannerSuggestModeDesc": "Vos modifications seront envoyées au propriétaire du voyage pour examen."
    },
    "id": {
        "bannerDirectEdit": "Edit Langsung",
        "bannerSuggestMode": "Mode Saran",
        "bannerDirectEditDesc": "Peran \"{{role}}\": Anda memiliki izin untuk mengedit langsung bagian yang ditugaskan.",
        "bannerSuggestModeDesc": "Perubahan Anda akan dikirim ke pemilik perjalanan untuk ditinjau."
    },
    "it": {
        "bannerDirectEdit": "Modifica Diretta",
        "bannerSuggestMode": "Modalità Suggerimento",
        "bannerDirectEditDesc": "Ruolo \"{{role}}\": Hai il permesso di modificare direttamente le parti assegnate.",
        "bannerSuggestModeDesc": "Le tue modifiche saranno inviate al proprietario del viaggio per la revisione."
    },
    "ja": {
        "bannerDirectEdit": "直接編集",
        "bannerSuggestMode": "提案モード",
        "bannerDirectEditDesc": "役割「{{role}}」：割り当てられた部分を直接編集する権限があります。",
        "bannerSuggestModeDesc": "変更内容は旅行の所有者に送信され、確認されます。"
    },
    "ko": {
        "bannerDirectEdit": "직접 편집",
        "bannerSuggestMode": "제안 모드",
        "bannerDirectEditDesc": "역할 \"{{role}}\": 할당된 부분을 직접 편집할 수 있는 권한이 있습니다.",
        "bannerSuggestModeDesc": "변경 사항은 검토를 위해 여행 소유자에게 전송됩니다."
    },
    "pt": {
        "bannerDirectEdit": "Edição Direta",
        "bannerSuggestMode": "Modo de Sugestão",
        "bannerDirectEditDesc": "Função \"{{role}}\": Você tem permissão para editar diretamente as partes atribuídas.",
        "bannerSuggestModeDesc": "Suas alterações serão enviadas ao proprietário da viagem para revisão."
    },
    "th": {
        "bannerDirectEdit": "แก้ไขโดยตรง",
        "bannerSuggestMode": "โหมดแนะนำ",
        "bannerDirectEditDesc": "บทบาท \"{{role}}\": คุณมีสิทธิ์ในการแก้ไขส่วนที่ได้รับมอบหมายโดยตรง",
        "bannerSuggestModeDesc": "การเปลี่ยนแปลงของคุณจะถูกส่งไปยังเจ้าของทริปเพื่อตรวจสอบ"
    },
    "zh": {
        "bannerDirectEdit": "直接编辑",
        "bannerSuggestMode": "建议模式",
        "bannerDirectEditDesc": "角色 \"{{role}}\"：您有权限直接编辑分配给您的部分。",
        "bannerSuggestModeDesc": "您的更改将发送给行程所有者进行审核。"
    }
}

for lang, trans in translations.items():
    filepath = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "sharedScreen" in data:
            data["sharedScreen"].update(trans)
        else:
            data["sharedScreen"] = trans
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
print("Successfully updated all languages.")
