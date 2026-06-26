import os
import json

locales_dir = 'src/locales'
translations = {
    "vi": {
        "cloudRestore": {
            "restoreSuccessMerge": "Khôi phục dữ liệu (hợp nhất) thành công!",
            "restoreSuccessReplace": "Khôi phục dữ liệu (thay thế) thành công!",
            "restoreFailed": "Khôi phục thất bại: "
        },
        "importPreview": {
            "untitledTrip": "Không có tên"
        }
    },
    "en": {
        "cloudRestore": {
            "restoreSuccessMerge": "Data restored (merged) successfully!",
            "restoreSuccessReplace": "Data restored (replaced) successfully!",
            "restoreFailed": "Restore failed: "
        },
        "importPreview": {
            "untitledTrip": "Untitled trip"
        }
    },
    "es": {
        "cloudRestore": {
            "restoreSuccessMerge": "¡Datos restaurados (combinados) correctamente!",
            "restoreSuccessReplace": "¡Datos restaurados (reemplazados) correctamente!",
            "restoreFailed": "Error al restaurar: "
        },
        "importPreview": {
            "untitledTrip": "Viaje sin título"
        }
    },
    "fr": {
        "cloudRestore": {
            "restoreSuccessMerge": "Données restaurées (fusionnées) avec succès !",
            "restoreSuccessReplace": "Données restaurées (remplacées) avec succès !",
            "restoreFailed": "Échec de la restauration : "
        },
        "importPreview": {
            "untitledTrip": "Voyage sans titre"
        }
    },
    "de": {
        "cloudRestore": {
            "restoreSuccessMerge": "Daten erfolgreich wiederhergestellt (zusammengeführt)!",
            "restoreSuccessReplace": "Daten erfolgreich wiederhergestellt (ersetzt)!",
            "restoreFailed": "Wiederherstellung fehlgeschlagen: "
        },
        "importPreview": {
            "untitledTrip": "Unbenannte Reise"
        }
    },
    "it": {
        "cloudRestore": {
            "restoreSuccessMerge": "Dati ripristinati (uniti) con successo!",
            "restoreSuccessReplace": "Dati ripristinati (sostituiti) con successo!",
            "restoreFailed": "Ripristino non riuscito: "
        },
        "importPreview": {
            "untitledTrip": "Viaggio senza titolo"
        }
    },
    "pt": {
        "cloudRestore": {
            "restoreSuccessMerge": "Dados restaurados (mesclados) com sucesso!",
            "restoreSuccessReplace": "Dados restaurados (substituídos) com sucesso!",
            "restoreFailed": "Falha na restauração: "
        },
        "importPreview": {
            "untitledTrip": "Viagem sem título"
        }
    },
    "id": {
        "cloudRestore": {
            "restoreSuccessMerge": "Data berhasil dipulihkan (digabungkan)!",
            "restoreSuccessReplace": "Data berhasil dipulihkan (diganti)!",
            "restoreFailed": "Gagal memulihkan: "
        },
        "importPreview": {
            "untitledTrip": "Perjalanan tanpa judul"
        }
    },
    "ja": {
        "cloudRestore": {
            "restoreSuccessMerge": "データが正常に復元（マージ）されました！",
            "restoreSuccessReplace": "データが正常に復元（置換）されました！",
            "restoreFailed": "復元に失敗しました: "
        },
        "importPreview": {
            "untitledTrip": "無題の旅行"
        }
    },
    "ko": {
        "cloudRestore": {
            "restoreSuccessMerge": "데이터가 성공적으로 복원(병합)되었습니다!",
            "restoreSuccessReplace": "데이터가 성공적으로 복원(교체)되었습니다!",
            "restoreFailed": "복원 실패: "
        },
        "importPreview": {
            "untitledTrip": "제목 없는 여행"
        }
    },
    "th": {
        "cloudRestore": {
            "restoreSuccessMerge": "กู้คืนข้อมูล (ผสาน) สำเร็จแล้ว!",
            "restoreSuccessReplace": "กู้คืนข้อมูล (แทนที่) สำเร็จแล้ว!",
            "restoreFailed": "การกู้คืนล้มเหลว: "
        },
        "importPreview": {
            "untitledTrip": "การเดินทางที่ไม่มีชื่อ"
        }
    },
    "zh": {
        "cloudRestore": {
            "restoreSuccessMerge": "数据已成功恢复（合并）！",
            "restoreSuccessReplace": "数据已成功恢复（替换）！",
            "restoreFailed": "恢复失败："
        },
        "importPreview": {
            "untitledTrip": "无标题行程"
        }
    }
}

for lang, trans in translations.items():
    filepath = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "settings" not in data:
            data["settings"] = {}
        if "dialogs" not in data["settings"]:
            data["settings"]["dialogs"] = {}
            
        if "cloudRestore" not in data["settings"]["dialogs"]:
            data["settings"]["dialogs"]["cloudRestore"] = {}
        data["settings"]["dialogs"]["cloudRestore"].update(trans["cloudRestore"])
        
        if "importPreview" not in data["settings"]["dialogs"]:
            data["settings"]["dialogs"]["importPreview"] = {}
        data["settings"]["dialogs"]["importPreview"].update(trans["importPreview"])
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

file_path = 'src/components/SettingsSheet.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'setSyncSuccess(`Khôi phục dữ liệu (${restoreMode === "merge" ? "hợp nhất" : "thay thế"}) thành công!`);',
    'setSyncSuccess(restoreMode === "merge" ? t("settings.dialogs.cloudRestore.restoreSuccessMerge") : t("settings.dialogs.cloudRestore.restoreSuccessReplace"));'
)
content = content.replace(
    'setSyncError("Khôi phục thất bại: " + (err.message || err));',
    'setSyncError(t("settings.dialogs.cloudRestore.restoreFailed") + (err.message || err));'
)
content = content.replace(
    'tripName: parsed.trip.title ?? "Không có tên",',
    'tripName: parsed.trip.title ?? t("settings.dialogs.importPreview.untitledTrip"),'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected cloudRestore translations and updated SettingsSheet")
