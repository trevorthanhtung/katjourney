import json
import os

translations = {
    "vi": {
        "deleteModalTitle": "Xóa vĩnh viễn chuyến đi này?",
        "deleteModalDesc": "Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu của chuyến đi, bao gồm thành viên, lịch trình, chi phí, chuẩn bị, bản tin hành trình, giấy tờ và phương án dự phòng khỏi thiết bị này. Bạn không thể hoàn tác.",
        "deleteModalWarning": "Để xác nhận, vui lòng nhập chính xác chữ XÓA.",
        "deleteModalConfirm": "Xóa vĩnh viễn chuyến đi",
        "deleteModalMatch": "XÓA",
        "deleteModalInput": "Nhập XÓA",
        "archiveModalTitle": "Đóng gói kỷ niệm?",
        "archiveModalDesc": "Hành trình này sẽ được đóng gói và đưa vào góc <b>Kỷ niệm</b>. Mọi dữ liệu sẽ được chuyển sang chế độ <b>chỉ xem</b> để lưu giữ nguyên vẹn những khoảnh khắc của bạn.",
        "archiveModalConfirm": "Đồng ý đóng gói",
        "unarchiveModalTitle": "Mở khóa chuyến đi?",
        "unarchiveModalDesc": "Chuyến đi sẽ được <b>mở khóa trở lại</b>. Bạn có thể tiếp tục lên lịch trình, đăng bài viết bản tin và quản lý chi phí như bình thường.",
        "unarchiveModalConfirm": "Tiếp tục hành trình"
    },
    "en": {
        "deleteModalTitle": "Delete this trip permanently?",
        "deleteModalDesc": "This action will permanently delete all trip data, including members, schedule, expenses, packing, journal, documents, and backups from this device. You cannot undo this.",
        "deleteModalWarning": "To confirm, please type exactly DELETE.",
        "deleteModalConfirm": "Permanently delete trip",
        "deleteModalMatch": "DELETE",
        "deleteModalInput": "Type DELETE",
        "archiveModalTitle": "Archive to Memories?",
        "archiveModalDesc": "This trip will be packed and moved to <b>Memories</b>. All data will switch to <b>read-only</b> mode to keep your moments intact.",
        "archiveModalConfirm": "Confirm archive",
        "unarchiveModalTitle": "Unlock trip?",
        "unarchiveModalDesc": "The trip will be <b>unlocked</b>. You can continue planning, posting journals, and managing expenses as usual.",
        "unarchiveModalConfirm": "Continue journey"
    },
    "ja": {
        "deleteModalTitle": "この旅行を完全に削除しますか？",
        "deleteModalDesc": "この操作により、メンバー、スケジュール、費用、パッキング、日記、書類など、このデバイスからすべての旅行データが完全に削除されます。元に戻すことはできません。",
        "deleteModalWarning": "確認のため、正確に 削除 と入力してください。",
        "deleteModalConfirm": "旅行を完全に削除",
        "deleteModalMatch": "削除",
        "deleteModalInput": "削除 と入力",
        "archiveModalTitle": "思い出にアーカイブしますか？",
        "archiveModalDesc": "この旅行はパッケージ化され、<b>思い出</b> に移動します。すべてのデータは <b>読み取り専用</b> モードになり、そのまま保存されます。",
        "archiveModalConfirm": "アーカイブを確認",
        "unarchiveModalTitle": "旅行のロックを解除しますか？",
        "unarchiveModalDesc": "旅行は <b>ロック解除</b> されます。通常通りスケジュール計画、日記投稿、費用管理を続けることができます。",
        "unarchiveModalConfirm": "旅行を続ける"
    },
    "ko": {
        "deleteModalTitle": "이 여행을 영구적으로 삭제하시겠습니까?",
        "deleteModalDesc": "이 작업은 이 기기에서 멤버, 일정, 비용, 짐싸기, 일지, 문서 등 모든 여행 데이터를 영구적으로 삭제합니다. 실행 취소할 수 없습니다.",
        "deleteModalWarning": "확인하려면 정확히 삭제를 입력하세요.",
        "deleteModalConfirm": "여행 영구 삭제",
        "deleteModalMatch": "삭제",
        "deleteModalInput": "삭제 입력",
        "archiveModalTitle": "추억으로 보관하시겠습니까?",
        "archiveModalDesc": "이 여행은 패키지되어 <b>추억</b>으로 이동됩니다. 모든 데이터는 순간을 온전히 보존하기 위해 <b>읽기 전용</b> 모드로 전환됩니다.",
        "archiveModalConfirm": "보관 확인",
        "unarchiveModalTitle": "여행 잠금을 해제하시겠습니까?",
        "unarchiveModalDesc": "여행이 <b>잠금 해제</b>됩니다. 평소처럼 일정을 계획하고 일지를 게시하며 비용을 관리할 수 있습니다.",
        "unarchiveModalConfirm": "여정 계속하기"
    },
    "zh": {
        "deleteModalTitle": "永久删除此行程吗？",
        "deleteModalDesc": "此操作将从此设备中永久删除所有行程数据，包括成员、日程、费用、行前准备、日记和文档等。此操作不可撤销。",
        "deleteModalWarning": "为了确认，请准确输入 删除。",
        "deleteModalConfirm": "永久删除行程",
        "deleteModalMatch": "删除",
        "deleteModalInput": "输入 删除",
        "archiveModalTitle": "归档到回忆吗？",
        "archiveModalDesc": "此行程将被打包并移动到<b>回忆</b>中。所有数据将切换为<b>只读</b>模式，以完好保存您的瞬间。",
        "archiveModalConfirm": "确认归档",
        "unarchiveModalTitle": "解锁行程吗？",
        "unarchiveModalDesc": "行程将被<b>重新解锁</b>。您可以像往常一样继续规划日程、发布日记和管理费用。",
        "unarchiveModalConfirm": "继续旅程"
    },
    "es": {
        "deleteModalTitle": "¿Eliminar este viaje permanentemente?",
        "deleteModalDesc": "Esta acción eliminará permanentemente todos los datos del viaje, incluyendo miembros, horario, gastos, equipaje, diario, documentos y copias de seguridad de este dispositivo. No puedes deshacer esto.",
        "deleteModalWarning": "Para confirmar, escribe exactamente ELIMINAR.",
        "deleteModalConfirm": "Eliminar viaje permanentemente",
        "deleteModalMatch": "ELIMINAR",
        "deleteModalInput": "Escribe ELIMINAR",
        "archiveModalTitle": "¿Archivar en Recuerdos?",
        "archiveModalDesc": "Este viaje se empaquetará y moverá a <b>Recuerdos</b>. Todos los datos cambiarán al modo de <b>solo lectura</b> para preservar sus momentos intactos.",
        "archiveModalConfirm": "Confirmar archivar",
        "unarchiveModalTitle": "¿Desbloquear viaje?",
        "unarchiveModalDesc": "El viaje se <b>desbloqueará</b>. Puede continuar planificando, publicando diarios y gestionando gastos como de costumbre.",
        "unarchiveModalConfirm": "Continuar viaje"
    },
    "fr": {
        "deleteModalTitle": "Supprimer ce voyage définitivement ?",
        "deleteModalDesc": "Cette action supprimera définitivement toutes les données du voyage, y compris les membres, le planning, les dépenses, les bagages, le journal et les documents de cet appareil. Vous ne pouvez pas annuler.",
        "deleteModalWarning": "Pour confirmer, tapez exactement SUPPRIMER.",
        "deleteModalConfirm": "Supprimer définitivement le voyage",
        "deleteModalMatch": "SUPPRIMER",
        "deleteModalInput": "Saisir SUPPRIMER",
        "archiveModalTitle": "Archiver dans Souvenirs ?",
        "archiveModalDesc": "Ce voyage sera emballé et déplacé vers <b>Souvenirs</b>. Toutes les données passeront en mode <b>lecture seule</b> pour conserver vos moments intacts.",
        "archiveModalConfirm": "Confirmer l'archivage",
        "unarchiveModalTitle": "Déverrouiller le voyage ?",
        "unarchiveModalDesc": "Le voyage sera <b>déverrouillé</b>. Vous pouvez continuer à planifier, publier des journaux et gérer les dépenses comme d'habitude.",
        "unarchiveModalConfirm": "Continuer le voyage"
    },
    "de": {
        "deleteModalTitle": "Diese Reise dauerhaft löschen?",
        "deleteModalDesc": "Diese Aktion wird alle Reisedaten, einschließlich Mitglieder, Zeitplan, Ausgaben, Gepäck, Tagebuch und Dokumente, dauerhaft von diesem Gerät löschen. Dies kann nicht rückgängig gemacht werden.",
        "deleteModalWarning": "Zur Bestätigung tippen Sie bitte genau LÖSCHEN.",
        "deleteModalConfirm": "Reise dauerhaft löschen",
        "deleteModalMatch": "LÖSCHEN",
        "deleteModalInput": "Tippen LÖSCHEN",
        "archiveModalTitle": "In Erinnerungen archivieren?",
        "archiveModalDesc": "Diese Reise wird verpackt und in <b>Erinnerungen</b> verschoben. Alle Daten wechseln in den <b>schreibgeschützten</b> Modus, um Ihre Momente intakt zu halten.",
        "archiveModalConfirm": "Archivieren bestätigen",
        "unarchiveModalTitle": "Reise entsperren?",
        "unarchiveModalDesc": "Die Reise wird <b>entsperrt</b>. Sie können wie gewohnt weiter planen, Tagebücher posten und Ausgaben verwalten.",
        "unarchiveModalConfirm": "Reise fortsetzen"
    },
    "it": {
        "deleteModalTitle": "Eliminare definitivamente questo viaggio?",
        "deleteModalDesc": "Questa azione eliminerà definitivamente tutti i dati del viaggio, inclusi membri, programma, spese, bagagli, diario e documenti da questo dispositivo. Non puoi annullare l'operazione.",
        "deleteModalWarning": "Per confermare, digita esattamente ELIMINA.",
        "deleteModalConfirm": "Elimina definitivamente il viaggio",
        "deleteModalMatch": "ELIMINA",
        "deleteModalInput": "Digita ELIMINA",
        "archiveModalTitle": "Archiviare in Ricordi?",
        "archiveModalDesc": "Questo viaggio verrà confezionato e spostato in <b>Ricordi</b>. Tutti i dati passeranno in modalità <b>sola lettura</b> per preservare i tuoi momenti.",
        "archiveModalConfirm": "Conferma archiviazione",
        "unarchiveModalTitle": "Sbloccare il viaggio?",
        "unarchiveModalDesc": "Il viaggio verrà <b>sbloccato</b>. Puoi continuare a pianificare, pubblicare diari e gestire le spese come al solito.",
        "unarchiveModalConfirm": "Continua il viaggio"
    },
    "pt": {
        "deleteModalTitle": "Excluir permanentemente esta viagem?",
        "deleteModalDesc": "Esta ação excluirá permanentemente todos os dados da viagem, incluindo membros, cronograma, despesas, bagagem, diário e documentos deste dispositivo. Você não pode desfazer isso.",
        "deleteModalWarning": "Para confirmar, digite exatamente EXCLUIR.",
        "deleteModalConfirm": "Excluir viagem permanentemente",
        "deleteModalMatch": "EXCLUIR",
        "deleteModalInput": "Digite EXCLUIR",
        "archiveModalTitle": "Arquivar em Memórias?",
        "archiveModalDesc": "Esta viagem será empacotada e movida para <b>Memórias</b>. Todos os dados mudarão para o modo <b>somente leitura</b> para preservar seus momentos.",
        "archiveModalConfirm": "Confirmar arquivamento",
        "unarchiveModalTitle": "Desbloquear viagem?",
        "unarchiveModalDesc": "A viagem será <b>desbloqueada</b>. Você pode continuar planejando, postando diários e gerenciando despesas normalmente.",
        "unarchiveModalConfirm": "Continuar jornada"
    },
    "th": {
        "deleteModalTitle": "ลบการเดินทางนี้อย่างถาวรหรือไม่?",
        "deleteModalDesc": "การกระทำนี้จะลบข้อมูลการเดินทางทั้งหมดรวมถึงสมาชิก กำหนดการ ค่าใช้จ่าย สัมภาระ บันทึก และเอกสารจากอุปกรณ์นี้อย่างถาวร คุณไม่สามารถยกเลิกได้",
        "deleteModalWarning": "เพื่อยืนยัน โปรดพิมพ์คำว่า ลบ",
        "deleteModalConfirm": "ลบการเดินทางอย่างถาวร",
        "deleteModalMatch": "ลบ",
        "deleteModalInput": "พิมพ์ ลบ",
        "archiveModalTitle": "เก็บถาวรในความทรงจำหรือไม่?",
        "archiveModalDesc": "การเดินทางนี้จะถูกเก็บและย้ายไปยัง <b>ความทรงจำ</b> ข้อมูลทั้งหมดจะเปลี่ยนเป็นโหมด <b>อ่านอย่างเดียว</b> เพื่อรักษาช่วงเวลาของคุณให้สมบูรณ์",
        "archiveModalConfirm": "ยืนยันการเก็บถาวร",
        "unarchiveModalTitle": "ปลดล็อคการเดินทางหรือไม่?",
        "unarchiveModalDesc": "การเดินทางจะถูก <b>ปลดล็อค</b> คุณสามารถดำเนินการวางแผน โพสต์บันทึก และจัดการค่าใช้จ่ายต่อไปได้ตามปกติ",
        "unarchiveModalConfirm": "เดินทางต่อไป"
    },
    "id": {
        "deleteModalTitle": "Hapus perjalanan ini secara permanen?",
        "deleteModalDesc": "Tindakan ini akan menghapus semua data perjalanan secara permanen, termasuk anggota, jadwal, pengeluaran, bagasi, jurnal, dan dokumen dari perangkat ini. Anda tidak dapat membatalkannya.",
        "deleteModalWarning": "Untuk mengonfirmasi, ketik tepatnya HAPUS.",
        "deleteModalConfirm": "Hapus perjalanan secara permanen",
        "deleteModalMatch": "HAPUS",
        "deleteModalInput": "Ketik HAPUS",
        "archiveModalTitle": "Arsipkan ke Kenangan?",
        "archiveModalDesc": "Perjalanan ini akan dikemas dan dipindahkan ke <b>Kenangan</b>. Semua data akan beralih ke mode <b>hanya baca</b> agar momen Anda tetap utuh.",
        "archiveModalConfirm": "Konfirmasi arsip",
        "unarchiveModalTitle": "Buka kunci perjalanan?",
        "unarchiveModalDesc": "Perjalanan akan <b>dibuka kuncinya</b>. Anda dapat melanjutkan perencanaan, memposting jurnal, dan mengelola pengeluaran seperti biasa.",
        "unarchiveModalConfirm": "Lanjutkan perjalanan"
    }
}

for lang, data_dict in translations.items():
    filepath = f"src/locales/{lang}.json"
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if "more" not in data:
        data["more"] = {}
        
    for k, v in data_dict.items():
        data["more"][k] = v

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {filepath}")
