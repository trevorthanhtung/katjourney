const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "src", "locales");
const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));

const translations = {
  de: {
    error: "Fehler beim Erstellen des Bildes. Bitte versuchen Sie es später erneut.",
    text: "Sehen Sie sich meine Reisekarte auf KAT Journey an!",
    btn_share: "Teilen",
    btn_save: "Bild speichern",
    fallback: "Teilen fehlgeschlagen, wechsle zum Herunterladen des Bildes...",
  },
  en: {
    error: "Error creating image. Please try again later.",
    text: "Check out my travel map on KAT Journey!",
    btn_share: "Share",
    btn_save: "Save Image",
    fallback: "Cannot share, automatically switching to download...",
  },
  es: {
    error: "Error al crear la imagen. Por favor, inténtelo de nuevo más tarde.",
    text: "¡Mira mi mapa de viajes en KAT Journey!",
    btn_share: "Compartir",
    btn_save: "Guardar imagen",
    fallback: "No se puede compartir, cambiando automáticamente a descarga...",
  },
  fr: {
    error: "Erreur lors de la création de l'image. Veuillez réessayer plus tard.",
    text: "Découvrez ma carte de voyage sur KAT Journey !",
    btn_share: "Partager",
    btn_save: "Enregistrer l'image",
    fallback: "Impossible de partager, basculement automatique vers le téléchargement...",
  },
  id: {
    error: "Terjadi kesalahan saat membuat gambar. Silakan coba lagi nanti.",
    text: "Lihat peta perjalanan saya di KAT Journey!",
    btn_share: "Bagikan",
    btn_save: "Simpan Gambar",
    fallback: "Tidak dapat membagikan, otomatis beralih ke unduh gambar...",
  },
  it: {
    error: "Errore durante la creazione dell'immagine. Riprova più tardi.",
    text: "Dai un'occhiata alla mia mappa di viaggio su KAT Journey!",
    btn_share: "Condividi",
    btn_save: "Salva immagine",
    fallback: "Impossibile condividere, passaggio automatico al download...",
  },
  ja: {
    error: "画像の作成中にエラーが発生しました。後でもう一度お試しください。",
    text: "KAT Journeyで私の旅行マップをチェックしてね！",
    btn_share: "共有",
    btn_save: "画像を保存",
    fallback: "共有できません。自動的に画像のダウンロードに切り替えます...",
  },
  ko: {
    error: "이미지 생성 중 오류가 발생했습니다. 나중에 다시 시도해 주세요.",
    text: "KAT Journey에서 제 여행 지도를 확인해 보세요!",
    btn_share: "공유",
    btn_save: "이미지 저장",
    fallback: "공유할 수 없습니다. 자동으로 이미지 다운로드로 전환합니다...",
  },
  pt: {
    error: "Erro ao criar imagem. Por favor, tente novamente mais tarde.",
    text: "Confira meu mapa de viagens no KAT Journey!",
    btn_share: "Compartilhar",
    btn_save: "Salvar Imagem",
    fallback: "Não é possível compartilhar, mudando automaticamente para download...",
  },
  th: {
    error: "เกิดข้อผิดพลาดในการสร้างรูปภาพ โปรดลองอีกครั้งในภายหลัง",
    text: "ดูแผนที่การเดินทางของฉันบน KAT Journey สิ!",
    btn_share: "แชร์",
    btn_save: "บันทึกรูปภาพ",
    fallback: "ไม่สามารถแชร์ได้ จะสลับไปดาวน์โหลดรูปภาพโดยอัตโนมัติ...",
  },
  vi: {
    error: "Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại sau.",
    text: "Xem bản đồ du lịch của tôi trên KAT Journey!",
    btn_share: "Chia sẻ",
    btn_save: "Tải ảnh",
    fallback: "Không thể chia sẻ, tự động chuyển sang tải ảnh...",
  },
  zh: {
    error: "创建图片时发生错误。请稍后再试。",
    text: "在 KAT Journey 上查看我的旅行地图！",
    btn_share: "分享",
    btn_save: "保存图片",
    fallback: "无法分享，自动切换为下载图片...",
  },
};

for (const file of files) {
  const lang = file.replace(".json", "");
  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!data.atlas) {
    data.atlas = {};
  }
  if (!data.atlas.share) {
    data.atlas.share = {};
  }

  const trans = translations[lang] || translations["en"];
  data.atlas.share = {
    ...data.atlas.share,
    ...trans,
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Updated ${file}`);
}
