import os
import json

locales_dir = 'src/locales'
translations = {
    "vi": {
        "pwa": {
            "newVersion": "Có phiên bản mới!",
            "offlineReady": "Sẵn sàng chạy ngoại tuyến",
            "newVersionDesc": "Ứng dụng KAT Journey đã có bản cập nhật mới nhất. Bạn có muốn tải về và làm mới ứng dụng ngay không?",
            "offlineReadyDesc": "Ứng dụng đã được lưu ngoại tuyến thành công, bạn có thể truy cập mà không cần mạng.",
            "later": "Để sau",
            "updateNow": "Cập nhật ngay"
        }
    },
    "en": {
        "pwa": {
            "newVersion": "New version available!",
            "offlineReady": "Ready to work offline",
            "newVersionDesc": "KAT Journey has a new update. Do you want to download and refresh the app now?",
            "offlineReadyDesc": "The app has been successfully saved offline. You can access it without a network connection.",
            "later": "Later",
            "updateNow": "Update now"
        }
    },
    "es": {
        "pwa": {
            "newVersion": "¡Nueva versión disponible!",
            "offlineReady": "Listo para trabajar sin conexión",
            "newVersionDesc": "KAT Journey tiene una nueva actualización. ¿Deseas descargar y actualizar la aplicación ahora?",
            "offlineReadyDesc": "La aplicación se ha guardado correctamente para su uso sin conexión. Puedes acceder sin conexión a la red.",
            "later": "Más tarde",
            "updateNow": "Actualizar ahora"
        }
    },
    "fr": {
        "pwa": {
            "newVersion": "Nouvelle version disponible !",
            "offlineReady": "Prêt pour une utilisation hors ligne",
            "newVersionDesc": "KAT Journey a une nouvelle mise à jour. Voulez-vous télécharger et rafraîchir l'application maintenant ?",
            "offlineReadyDesc": "L'application a été enregistrée avec succès hors ligne. Vous pouvez y accéder sans connexion réseau.",
            "later": "Plus tard",
            "updateNow": "Mettre à jour"
        }
    },
    "de": {
        "pwa": {
            "newVersion": "Neue Version verfügbar!",
            "offlineReady": "Bereit für den Offline-Betrieb",
            "newVersionDesc": "KAT Journey hat ein neues Update. Möchten Sie die App jetzt herunterladen und aktualisieren?",
            "offlineReadyDesc": "Die App wurde erfolgreich für den Offline-Betrieb gespeichert. Sie können ohne Netzwerkverbindung darauf zugreifen.",
            "later": "Später",
            "updateNow": "Jetzt aktualisieren"
        }
    },
    "it": {
        "pwa": {
            "newVersion": "Nuova versione disponibile!",
            "offlineReady": "Pronto per l'uso offline",
            "newVersionDesc": "KAT Journey ha un nuovo aggiornamento. Vuoi scaricare e aggiornare l'app ora?",
            "offlineReadyDesc": "L'app è stata salvata con successo offline. Puoi accedervi senza connessione di rete.",
            "later": "Più tardi",
            "updateNow": "Aggiorna ora"
        }
    },
    "pt": {
        "pwa": {
            "newVersion": "Nova versão disponível!",
            "offlineReady": "Pronto para uso offline",
            "newVersionDesc": "KAT Journey tem uma nova atualização. Deseja baixar e atualizar o aplicativo agora?",
            "offlineReadyDesc": "O aplicativo foi salvo com sucesso para uso offline. Você pode acessá-lo sem conexão de rede.",
            "later": "Mais tarde",
            "updateNow": "Atualizar agora"
        }
    },
    "id": {
        "pwa": {
            "newVersion": "Versi baru tersedia!",
            "offlineReady": "Siap bekerja offline",
            "newVersionDesc": "KAT Journey memiliki pembaruan baru. Apakah Anda ingin mengunduh dan menyegarkan aplikasi sekarang?",
            "offlineReadyDesc": "Aplikasi telah berhasil disimpan offline. Anda dapat mengaksesnya tanpa koneksi jaringan.",
            "later": "Nanti",
            "updateNow": "Perbarui sekarang"
        }
    },
    "ja": {
        "pwa": {
            "newVersion": "新しいバージョンが利用可能です！",
            "offlineReady": "オフラインで使用する準備ができました",
            "newVersionDesc": "KAT Journeyの新しいアップデートがあります。今すぐアプリをダウンロードして更新しますか？",
            "offlineReadyDesc": "アプリがオフライン用に正常に保存されました。ネットワーク接続なしでアクセスできます。",
            "later": "後で",
            "updateNow": "今すぐ更新"
        }
    },
    "ko": {
        "pwa": {
            "newVersion": "새 버전을 사용할 수 있습니다!",
            "offlineReady": "오프라인으로 사용할 준비가 되었습니다",
            "newVersionDesc": "KAT Journey의 새로운 업데이트가 있습니다. 지금 앱을 다운로드하고 새로 고치시겠습니까?",
            "offlineReadyDesc": "앱이 오프라인용으로 성공적으로 저장되었습니다. 네트워크 연결 없이 액세스할 수 있습니다.",
            "later": "나중에",
            "updateNow": "지금 업데이트"
        }
    },
    "th": {
        "pwa": {
            "newVersion": "มีเวอร์ชันใหม่!",
            "offlineReady": "พร้อมสำหรับการใช้งานออฟไลน์",
            "newVersionDesc": "KAT Journey มีการอัปเดตใหม่ คุณต้องการดาวน์โหลดและรีเฟรชแอปทันทีหรือไม่?",
            "offlineReadyDesc": "บันทึกแอปสำหรับการใช้งานออฟไลน์สำเร็จแล้ว คุณสามารถเข้าถึงได้โดยไม่ต้องเชื่อมต่อเครือข่าย",
            "later": "ไว้ทีหลัง",
            "updateNow": "อัปเดตเลย"
        }
    },
    "zh": {
        "pwa": {
            "newVersion": "有新版本可用！",
            "offlineReady": "已准备好离线使用",
            "newVersionDesc": "KAT Journey 有新更新。您现在要下载并刷新应用程序吗？",
            "offlineReadyDesc": "应用程序已成功保存以供离线使用。您可以在没有网络连接的情况下访问它。",
            "later": "稍后",
            "updateNow": "立即更新"
        }
    }
}

for lang, trans in translations.items():
    filepath = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "pwa" not in data:
            data["pwa"] = {}
        data["pwa"].update(trans["pwa"])
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

file_path = 'src/components/ReloadPrompt.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Import useTranslation if not present
if "useTranslation" not in content:
    content = content.replace('import React from "react";', 'import React from "react";\nimport { useTranslation } from "react-i18next";')

# Inject t hook
if "const { t } = useTranslation();" not in content:
    content = content.replace('export function ReloadPrompt() {\n  const [registration, setRegistration] = React.useState', 'export function ReloadPrompt() {\n  const { t } = useTranslation();\n  const [registration, setRegistration] = React.useState')

# Replace strings
content = content.replace('{needRefresh ? "Có phiên bản mới!" : "Sẵn sàng chạy ngoại tuyến"}', '{needRefresh ? t("pwa.newVersion") : t("pwa.offlineReady")}')
content = content.replace('{needRefresh\n                ? "Ứng dụng KAT Journey đã có bản cập nhật mới nhất. Bạn có muốn tải về và làm mới ứng dụng ngay không?"\n                : "Ứng dụng đã được lưu ngoại tuyến thành công, bạn có thể truy cập mà không cần mạng."}', '{needRefresh\n                ? t("pwa.newVersionDesc")\n                : t("pwa.offlineReadyDesc")}')
content = content.replace('Để sau\n          </button>', '{t("pwa.later")}\n          </button>')
content = content.replace('Cập nhật ngay\n            </button>', '{t("pwa.updateNow")}\n            </button>')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected pwa translations and updated ReloadPrompt")
