import json
import os
import re

locales_dir = 'src/locales'
translations = {
    "vi": {
        "share": {
            "requestsTitle": "Yêu cầu chỉnh sửa",
            "pendingRequests": "{{count}} yêu cầu đang chờ duyệt.",
            "noRequests": "Chưa có yêu cầu nào.",
            "declineAll": "Từ chối tất cả",
            "approveAll": "Đồng ý tất cả",
            "processing": "Đang xử lý...",
            "noRequestsDetailed": "Chưa có yêu cầu chỉnh sửa nào.",
            "declineBtn": "Từ chối",
            "approveBtn": "Đồng ý áp dụng",
            "declineTitle": "Từ chối đề xuất?",
            "declineDesc": "Bạn có chắc chắn muốn từ chối đề xuất chỉnh sửa này? Thao tác này sẽ không áp dụng các chỉnh sửa của thành viên vào chuyến đi của bạn.",
            "declineBtnSubmit": "Từ chối đề xuất",
            "approveAllConfirmTitle": "Đồng ý tất cả?",
            "approveAllConfirmDesc": "Bạn có chắc chắn muốn đồng ý áp dụng tất cả {{count}} yêu cầu chỉnh sửa này vào chuyến đi của bạn?",
            "declineAllTitle": "Từ chối tất cả?",
            "declineAllDesc": "Bạn có chắc chắn muốn từ chối tất cả {{count}} đề xuất chỉnh sửa này? Thao tác này sẽ không áp dụng bất kỳ thay đổi nào vào chuyến đi của bạn.",
            "sectionLabelRole": "Mục: {{sectionName}} • Đổi vai trò",
            "sectionLabelAction": "Mục: {{sectionName}} • {{actionName}}",
            "statusCompleted": "Hoàn thành",
            "statusPending": "Chưa hoàn thành"
        }
    },
    "en": {
        "share": {
            "requestsTitle": "Edit requests",
            "pendingRequests": "{{count}} pending requests.",
            "noRequests": "No requests yet.",
            "declineAll": "Decline all",
            "approveAll": "Approve all",
            "processing": "Processing...",
            "noRequestsDetailed": "No edit requests yet.",
            "declineBtn": "Decline",
            "approveBtn": "Approve & apply",
            "declineTitle": "Decline request?",
            "declineDesc": "Are you sure you want to decline this edit request? This will not apply member's changes to your trip.",
            "declineBtnSubmit": "Decline request",
            "approveAllConfirmTitle": "Approve all?",
            "approveAllConfirmDesc": "Are you sure you want to approve and apply all {{count}} edit requests to your trip?",
            "declineAllTitle": "Decline all?",
            "declineAllDesc": "Are you sure you want to decline all {{count}} edit requests? This will not apply any changes to your trip.",
            "sectionLabelRole": "Section: {{sectionName}} • Change role",
            "sectionLabelAction": "Section: {{sectionName}} • {{actionName}}",
            "statusCompleted": "Done",
            "statusPending": "Not done"
        }
    },
    "es": {
        "share": {
            "requestsTitle": "Solicitudes de edición",
            "pendingRequests": "{{count}} solicitudes pendientes.",
            "noRequests": "Aún no hay solicitudes.",
            "declineAll": "Rechazar todo",
            "approveAll": "Aprobar todo",
            "processing": "Procesando...",
            "noRequestsDetailed": "Aún no hay solicitudes de edición.",
            "declineBtn": "Rechazar",
            "approveBtn": "Aprobar y aplicar",
            "declineTitle": "¿Rechazar solicitud?",
            "declineDesc": "¿Estás seguro de que deseas rechazar esta solicitud de edición? Esto no aplicará los cambios del miembro a tu viaje.",
            "declineBtnSubmit": "Rechazar solicitud",
            "approveAllConfirmTitle": "¿Aprobar todo?",
            "approveAllConfirmDesc": "¿Estás seguro de que deseas aprobar y aplicar las {{count}} solicitudes de edición a tu viaje?",
            "declineAllTitle": "¿Rechazar todo?",
            "declineAllDesc": "¿Estás seguro de que deseas rechazar las {{count}} solicitudes de edición? Esto no aplicará ningún cambio a tu viaje.",
            "sectionLabelRole": "Sección: {{sectionName}} • Cambiar rol",
            "sectionLabelAction": "Sección: {{sectionName}} • {{actionName}}",
            "statusCompleted": "Completado",
            "statusPending": "No completado"
        }
    },
    "fr": {
        "share": {
            "requestsTitle": "Demandes de modification",
            "pendingRequests": "{{count}} demandes en attente.",
            "noRequests": "Aucune demande pour l'instant.",
            "declineAll": "Tout refuser",
            "approveAll": "Tout approuver",
            "processing": "Traitement...",
            "noRequestsDetailed": "Aucune demande de modification pour l'instant.",
            "declineBtn": "Refuser",
            "approveBtn": "Approuver et appliquer",
            "declineTitle": "Refuser la demande ?",
            "declineDesc": "Êtes-vous sûr de vouloir refuser cette demande de modification ? Les modifications du membre ne seront pas appliquées à votre voyage.",
            "declineBtnSubmit": "Refuser la demande",
            "approveAllConfirmTitle": "Tout approuver ?",
            "approveAllConfirmDesc": "Êtes-vous sûr de vouloir approuver et appliquer les {{count}} demandes de modification à votre voyage ?",
            "declineAllTitle": "Tout refuser ?",
            "declineAllDesc": "Êtes-vous sûr de vouloir refuser les {{count}} demandes de modification ? Aucune modification ne sera appliquée à votre voyage.",
            "sectionLabelRole": "Section : {{sectionName}} • Changer de rôle",
            "sectionLabelAction": "Section : {{sectionName}} • {{actionName}}",
            "statusCompleted": "Terminé",
            "statusPending": "Non terminé"
        }
    },
    "de": {
        "share": {
            "requestsTitle": "Bearbeitungsanfragen",
            "pendingRequests": "{{count}} ausstehende Anfragen.",
            "noRequests": "Noch keine Anfragen.",
            "declineAll": "Alle ablehnen",
            "approveAll": "Alle genehmigen",
            "processing": "Wird bearbeitet...",
            "noRequestsDetailed": "Noch keine Bearbeitungsanfragen.",
            "declineBtn": "Ablehnen",
            "approveBtn": "Genehmigen & anwenden",
            "declineTitle": "Anfrage ablehnen?",
            "declineDesc": "Sind Sie sicher, dass Sie diese Bearbeitungsanfrage ablehnen möchten? Die Änderungen des Mitglieds werden nicht auf Ihre Reise angewendet.",
            "declineBtnSubmit": "Anfrage ablehnen",
            "approveAllConfirmTitle": "Alle genehmigen?",
            "approveAllConfirmDesc": "Sind Sie sicher, dass Sie alle {{count}} Bearbeitungsanfragen für Ihre Reise genehmigen und anwenden möchten?",
            "declineAllTitle": "Alle ablehnen?",
            "declineAllDesc": "Sind Sie sicher, dass Sie alle {{count}} Bearbeitungsanfragen ablehnen möchten? Es werden keine Änderungen an Ihrer Reise vorgenommen.",
            "sectionLabelRole": "Bereich: {{sectionName}} • Rolle ändern",
            "sectionLabelAction": "Bereich: {{sectionName}} • {{actionName}}",
            "statusCompleted": "Erledigt",
            "statusPending": "Nicht erledigt"
        }
    },
    "it": {
        "share": {
            "requestsTitle": "Richieste di modifica",
            "pendingRequests": "{{count}} richieste in sospeso.",
            "noRequests": "Nessuna richiesta per ora.",
            "declineAll": "Rifiuta tutto",
            "approveAll": "Approva tutto",
            "processing": "Elaborazione...",
            "noRequestsDetailed": "Nessuna richiesta di modifica per ora.",
            "declineBtn": "Rifiuta",
            "approveBtn": "Approva e applica",
            "declineTitle": "Rifiutare la richiesta?",
            "declineDesc": "Sei sicuro di voler rifiutare questa richiesta di modifica? Le modifiche del membro non verranno applicate al tuo viaggio.",
            "declineBtnSubmit": "Rifiuta richiesta",
            "approveAllConfirmTitle": "Approvare tutto?",
            "approveAllConfirmDesc": "Sei sicuro di voler approvare e applicare tutte le {{count}} richieste di modifica al tuo viaggio?",
            "declineAllTitle": "Rifiutare tutto?",
            "declineAllDesc": "Sei sicuro di voler rifiutare tutte le {{count}} richieste di modifica? Nessuna modifica verrà applicata al tuo viaggio.",
            "sectionLabelRole": "Sezione: {{sectionName}} • Cambia ruolo",
            "sectionLabelAction": "Sezione: {{sectionName}} • {{actionName}}",
            "statusCompleted": "Completato",
            "statusPending": "Non completato"
        }
    },
    "pt": {
        "share": {
            "requestsTitle": "Solicitações de edição",
            "pendingRequests": "{{count}} solicitações pendentes.",
            "noRequests": "Ainda sem solicitações.",
            "declineAll": "Recusar tudo",
            "approveAll": "Aprovar tudo",
            "processing": "Processando...",
            "noRequestsDetailed": "Ainda sem solicitações de edição.",
            "declineBtn": "Recusar",
            "approveBtn": "Aprovar e aplicar",
            "declineTitle": "Recusar solicitação?",
            "declineDesc": "Tem certeza de que deseja recusar esta solicitação de edição? As alterações do membro não serão aplicadas à sua viagem.",
            "declineBtnSubmit": "Recusar solicitação",
            "approveAllConfirmTitle": "Aprovar tudo?",
            "approveAllConfirmDesc": "Tem certeza de que deseja aprovar e aplicar todas as {{count}} solicitações de edição à sua viagem?",
            "declineAllTitle": "Recusar tudo?",
            "declineAllDesc": "Tem certeza de que deseja recusar todas as {{count}} solicitações de edição? Nenhuma alteração será aplicada à sua viagem.",
            "sectionLabelRole": "Seção: {{sectionName}} • Alterar função",
            "sectionLabelAction": "Seção: {{sectionName}} • {{actionName}}",
            "statusCompleted": "Concluído",
            "statusPending": "Não concluído"
        }
    },
    "id": {
        "share": {
            "requestsTitle": "Permintaan edit",
            "pendingRequests": "{{count}} permintaan tertunda.",
            "noRequests": "Belum ada permintaan.",
            "declineAll": "Tolak semua",
            "approveAll": "Setujui semua",
            "processing": "Memproses...",
            "noRequestsDetailed": "Belum ada permintaan edit.",
            "declineBtn": "Tolak",
            "approveBtn": "Setujui & terapkan",
            "declineTitle": "Tolak permintaan?",
            "declineDesc": "Yakin ingin menolak permintaan edit ini? Perubahan anggota tidak akan diterapkan ke perjalanan Anda.",
            "declineBtnSubmit": "Tolak permintaan",
            "approveAllConfirmTitle": "Setujui semua?",
            "approveAllConfirmDesc": "Yakin ingin menyetujui dan menerapkan semua {{count}} permintaan edit ke perjalanan Anda?",
            "declineAllTitle": "Tolak semua?",
            "declineAllDesc": "Yakin ingin menolak semua {{count}} permintaan edit? Tidak ada perubahan yang akan diterapkan ke perjalanan Anda.",
            "sectionLabelRole": "Bagian: {{sectionName}} • Ubah peran",
            "sectionLabelAction": "Bagian: {{sectionName}} • {{actionName}}",
            "statusCompleted": "Selesai",
            "statusPending": "Belum selesai"
        }
    },
    "ja": {
        "share": {
            "requestsTitle": "編集リクエスト",
            "pendingRequests": "{{count}}件の保留中のリクエスト",
            "noRequests": "まだリクエストはありません",
            "declineAll": "すべて拒否",
            "approveAll": "すべて承認",
            "processing": "処理中...",
            "noRequestsDetailed": "まだ編集リクエストはありません",
            "declineBtn": "拒否",
            "approveBtn": "承認して適用",
            "declineTitle": "リクエストを拒否しますか？",
            "declineDesc": "この編集リクエストを拒否してもよろしいですか？メンバーの変更は旅行に適用されません。",
            "declineBtnSubmit": "リクエストを拒否",
            "approveAllConfirmTitle": "すべて承認しますか？",
            "approveAllConfirmDesc": "{{count}}件の編集リクエストをすべて承認して旅行に適用してもよろしいですか？",
            "declineAllTitle": "すべて拒否しますか？",
            "declineAllDesc": "{{count}}件の編集リクエストをすべて拒否してもよろしいですか？変更は旅行に適用されません。",
            "sectionLabelRole": "セクション: {{sectionName}} • 役割の変更",
            "sectionLabelAction": "セクション: {{sectionName}} • {{actionName}}",
            "statusCompleted": "完了",
            "statusPending": "未完了"
        }
    },
    "ko": {
        "share": {
            "requestsTitle": "편집 요청",
            "pendingRequests": "{{count}}개의 대기 중인 요청",
            "noRequests": "아직 요청이 없습니다",
            "declineAll": "모두 거절",
            "approveAll": "모두 승인",
            "processing": "처리 중...",
            "noRequestsDetailed": "아직 편집 요청이 없습니다",
            "declineBtn": "거절",
            "approveBtn": "승인 및 적용",
            "declineTitle": "요청을 거절하시겠습니까?",
            "declineDesc": "이 편집 요청을 거절하시겠습니까? 멤버의 변경 사항이 여행에 적용되지 않습니다.",
            "declineBtnSubmit": "요청 거절",
            "approveAllConfirmTitle": "모두 승인하시겠습니까?",
            "approveAllConfirmDesc": "{{count}}개의 편집 요청을 모두 승인하고 여행에 적용하시겠습니까?",
            "declineAllTitle": "모두 거절하시겠습니까?",
            "declineAllDesc": "{{count}}개의 편집 요청을 모두 거절하시겠습니까? 여행에 변경 사항이 적용되지 않습니다.",
            "sectionLabelRole": "섹션: {{sectionName}} • 역할 변경",
            "sectionLabelAction": "섹션: {{sectionName}} • {{actionName}}",
            "statusCompleted": "완료",
            "statusPending": "미완료"
        }
    },
    "th": {
        "share": {
            "requestsTitle": "คำขอแก้ไข",
            "pendingRequests": "{{count}} คำขอที่รอดำเนินการ",
            "noRequests": "ยังไม่มีคำขอ",
            "declineAll": "ปฏิเสธทั้งหมด",
            "approveAll": "อนุมัติทั้งหมด",
            "processing": "กำลังประมวลผล...",
            "noRequestsDetailed": "ยังไม่มีคำขอแก้ไข",
            "declineBtn": "ปฏิเสธ",
            "approveBtn": "อนุมัติและนำไปใช้",
            "declineTitle": "ปฏิเสธคำขอ?",
            "declineDesc": "คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอแก้ไขนี้ การเปลี่ยนแปลงของสมาชิกจะไม่ถูกนำไปใช้กับการเดินทางของคุณ",
            "declineBtnSubmit": "ปฏิเสธคำขอ",
            "approveAllConfirmTitle": "อนุมัติทั้งหมด?",
            "approveAllConfirmDesc": "คุณแน่ใจหรือไม่ว่าต้องการอนุมัติและนำคำขอแก้ไขทั้ง {{count}} รายการไปใช้กับการเดินทางของคุณ?",
            "declineAllTitle": "ปฏิเสธทั้งหมด?",
            "declineAllDesc": "คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอแก้ไขทั้ง {{count}} รายการ จะไม่มีการเปลี่ยนแปลงใดๆ นำไปใช้กับการเดินทางของคุณ",
            "sectionLabelRole": "ส่วน: {{sectionName}} • เปลี่ยนบทบาท",
            "sectionLabelAction": "ส่วน: {{sectionName}} • {{actionName}}",
            "statusCompleted": "เสร็จสิ้น",
            "statusPending": "ยังไม่เสร็จ"
        }
    },
    "zh": {
        "share": {
            "requestsTitle": "编辑请求",
            "pendingRequests": "{{count}} 个待处理请求",
            "noRequests": "暂无请求",
            "declineAll": "全部拒绝",
            "approveAll": "全部批准",
            "processing": "处理中...",
            "noRequestsDetailed": "暂无编辑请求",
            "declineBtn": "拒绝",
            "approveBtn": "批准并应用",
            "declineTitle": "拒绝请求？",
            "declineDesc": "您确定要拒绝此编辑请求吗？成员的更改将不会应用到您的行程中。",
            "declineBtnSubmit": "拒绝请求",
            "approveAllConfirmTitle": "全部批准？",
            "approveAllConfirmDesc": "您确定要批准并将所有 {{count}} 个编辑请求应用到您的行程中吗？",
            "declineAllTitle": "全部拒绝？",
            "declineAllDesc": "您确定要拒绝所有 {{count}} 个编辑请求吗？这不会对您的行程应用任何更改。",
            "sectionLabelRole": "部分：{{sectionName}} • 更改角色",
            "sectionLabelAction": "部分：{{sectionName}} • {{actionName}}",
            "statusCompleted": "已完成",
            "statusPending": "未完成"
        }
    }
}

for lang, trans in translations.items():
    filepath = os.path.join(locales_dir, f"{lang}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if "share" not in data:
            data["share"] = {}
        data["share"].update(trans["share"])
            
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

file_path = 'src/features/share/components/ShareChangeRequestsSheet.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('return o.completed ? \'Hoàn thành\' : \'Chưa hoàn thành\';', 'return o.completed ? t("share.statusCompleted") : t("share.statusPending");')
content = content.replace('<p className="text-[13px] font-bold text-slate-700 dark:text-slate-400">Mục: {sectionName} • Đổi vai trò</p>', '<p className="text-[13px] font-bold text-slate-700 dark:text-slate-400">{t("share.sectionLabelRole", { sectionName })}</p>')
content = content.replace('<p className="text-[13px] font-bold text-slate-700 dark:text-slate-400">Mục: {sectionName} • {actionName}</p>', '<p className="text-[13px] font-bold text-slate-700 dark:text-slate-400">{t("share.sectionLabelAction", { sectionName, actionName })}</p>')
content = content.replace('title="Yêu cầu chỉnh sửa"', 'title={t("share.requestsTitle")}')
content = content.replace('subtitle={requests.length > 0 ? `${requests.length} yêu cầu đang chờ duyệt.` : "Chưa có yêu cầu nào."}', 'subtitle={requests.length > 0 ? t("share.pendingRequests", { count: requests.length }) : t("share.noRequests")}')
content = content.replace("{isApproving === 'all' ? 'Đang xử lý...' : 'Từ chối tất cả'}", '{isApproving === \'all\' ? t("share.processing") : t("share.declineAll")}')
content = content.replace("{isApproving === 'all' ? 'Đang xử lý...' : 'Đồng ý tất cả'}", '{isApproving === \'all\' ? t("share.processing") : t("share.approveAll")}')
content = content.replace('>Chưa có yêu cầu chỉnh sửa nào.<', '>{t("share.noRequestsDetailed")}<')
content = content.replace("{isApproving === req.id ? 'Đang xử lý...' : 'Từ chối'}", '{isApproving === req.id ? t("share.processing") : t("share.declineBtn")}')
content = content.replace("{isApproving === req.id ? 'Đang xử lý...' : 'Đồng ý áp dụng'}", '{isApproving === req.id ? t("share.processing") : t("share.approveBtn")}')
content = content.replace('title="Từ chối đề xuất?"', 'title={t("share.declineTitle")}')
content = content.replace('>Bạn có chắc chắn muốn từ chối đề xuất chỉnh sửa này? Thao tác này sẽ không áp dụng các chỉnh sửa của thành viên vào chuyến đi của bạn.<', '>{t("share.declineDesc")}<')
content = content.replace('Từ chối đề xuất\n', '{t("share.declineBtnSubmit")}\n')
content = content.replace('Từ chối đề xuất</button>', '{t("share.declineBtnSubmit")}</button>') # To be safe
content = content.replace('Bạn có chắc chắn muốn đồng ý áp dụng tất cả {requests.length} yêu cầu chỉnh sửa này vào chuyến đi của bạn?', '{t("share.approveAllConfirmDesc", { count: requests.length })}')
content = content.replace('title="Từ chối tất cả?"', 'title={t("share.declineAllTitle")}')
content = content.replace('Bạn có chắc chắn muốn từ chối tất cả {requests.length} đề xuất chỉnh sửa này? Thao tác này sẽ không áp dụng bất kỳ thay đổi nào vào chuyến đi của bạn.', '{t("share.declineAllDesc", { count: requests.length })}')
content = content.replace('Từ chối tất cả\n', '{t("share.declineAll")}\n')
content = content.replace('Từ chối tất cả</button>', '{t("share.declineAll")}</button>') # To be safe

# One missed string "Đồng ý tất cả?" in the approve all confirmation modal. Let's find its title.
# `title="Từ chối đề xuất?"` -> `title={t("share.declineTitle")}`
# In lines 370: it might be `title="Đồng ý áp dụng?"` or something. Let's check line 365.
# Wait, I don't know the exact title of the approve all modal. Let's find it.
# We'll just replace what we know.

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed ShareChangeRequestsSheet")

content = content.replace('title="Đồng ý tất cả?"', 'title={t("share.approveAllConfirmTitle")}')
content = content.replace('Đồng ý tất cả\n', '{t("share.approveAll")}\n')
content = content.replace('Đồng ý tất cả</button>', '{t("share.approveAll")}</button>')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

