const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "src", "locales");

const updates = {
  vi: {
    "share.viewer": "Người xem",
    "share.noMembersTitle": "Chưa có thành viên nào",
    "share.noMembersDesc":
      "Thêm thành viên để cùng chia chi phí, chuẩn bị hành lý và lưu lại vai trò trong chuyến đi.",
    "dashboard.trips": "Chuyến đi",
  },
  en: {
    "share.viewer": "Viewer",
    "share.noMembersTitle": "No members yet",
    "share.noMembersDesc": "Add members to split costs, pack luggage, and save roles on the trip.",
    "dashboard.trips": "Trips",
  },
  ja: {
    "share.viewer": "閲覧者",
    "share.noMembersTitle": "まだメンバーはいません",
    "share.noMembersDesc":
      "メンバーを追加して費用を分割し、荷物を準備し、旅行での役割を保存します。",
    "dashboard.trips": "旅行",
    "splash.subtitle": "探索と思い出",
  },
  ko: {
    "share.viewer": "뷰어",
    "share.noMembersTitle": "아직 멤버가 없습니다",
    "share.noMembersDesc":
      "멤버를 추가하여 비용을 분담하고, 수하물을 준비하고, 여행 역할을 저장하세요.",
    "dashboard.trips": "여행",
    "splash.subtitle": "탐험과 추억",
  },
  zh: {
    "share.viewer": "查看者",
    "share.noMembersTitle": "暂无成员",
    "share.noMembersDesc": "添加成员以分摊费用、准备行李并在旅行中保存角色。",
    "dashboard.trips": "行程",
    "splash.subtitle": "探索与回忆",
  },
  th: {
    "share.viewer": "ผู้เข้าชม",
    "share.noMembersTitle": "ยังไม่มีสมาชิก",
    "share.noMembersDesc":
      "เพิ่มสมาชิกเพื่อแบ่งปันค่าใช้จ่าย เตรียมกระเป๋าเดินทาง และบันทึกบทบาทในการเดินทาง",
    "dashboard.trips": "การเดินทาง",
    "splash.subtitle": "สำรวจและความทรงจำ",
  },
  es: {
    "share.viewer": "Espectador",
    "share.noMembersTitle": "Aún no hay miembros",
    "share.noMembersDesc":
      "Agregue miembros para dividir costos, preparar equipaje y guardar roles en el viaje.",
    "dashboard.trips": "Viajes",
  },
  fr: {
    "share.viewer": "Spectateur",
    "share.noMembersTitle": "Pas encore de membres",
    "share.noMembersDesc":
      "Ajoutez des membres pour diviser les coûts, préparer les bagages et enregistrer les rôles pendant le voyage.",
    "dashboard.trips": "Voyages",
  },
  de: {
    "share.viewer": "Zuschauer",
    "share.noMembersTitle": "Noch keine Mitglieder",
    "share.noMembersDesc":
      "Fügen Sie Mitglieder hinzu, um Kosten zu teilen, Gepäck vorzubereiten und Rollen auf der Reise zu speichern.",
    "dashboard.trips": "Reisen",
  },
  it: {
    "share.viewer": "Spettatore",
    "share.noMembersTitle": "Nessun membro ancora",
    "share.noMembersDesc":
      "Aggiungi membri per dividere i costi, preparare i bagagli e salvare i ruoli nel viaggio.",
    "dashboard.trips": "Viaggi",
  },
  pt: {
    "share.viewer": "Visualizador",
    "share.noMembersTitle": "Ainda sem membros",
    "share.noMembersDesc":
      "Adicione membros para dividir custos, preparar bagagens e salvar papéis na viagem.",
    "dashboard.trips": "Viagens",
  },
  id: {
    "share.viewer": "Penonton",
    "share.noMembersTitle": "Belum ada anggota",
    "share.noMembersDesc":
      "Tambahkan anggota untuk membagi biaya, menyiapkan bagasi, dan menyimpan peran dalam perjalanan.",
    "dashboard.trips": "Perjalanan",
  },
};

for (const lang in updates) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) continue;

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const newKeys = updates[lang];

  for (const keyPath in newKeys) {
    const keys = keyPath.split(".");
    let current = data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = newKeys[keyPath];
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  console.log(`Updated ${lang}.json`);
}
