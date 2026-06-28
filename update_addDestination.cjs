const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "src", "locales");

const updates = {
  vi: { "tripForm.addDestination": "Thêm điểm đến" },
  en: { "tripForm.addDestination": "Add destination" },
  ja: { "tripForm.addDestination": "目的地を追加" },
  ko: { "tripForm.addDestination": "목적지 추가" },
  zh: { "tripForm.addDestination": "添加目的地" },
  th: { "tripForm.addDestination": "เพิ่มจุดหมายปลายทาง" },
  es: { "tripForm.addDestination": "Añadir destino" },
  fr: { "tripForm.addDestination": "Ajouter une destination" },
  de: { "tripForm.addDestination": "Ziel hinzufügen" },
  it: { "tripForm.addDestination": "Aggiungi destinazione" },
  pt: { "tripForm.addDestination": "Adicionar destino" },
  id: { "tripForm.addDestination": "Tambah destinasi" },
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
  console.log(`Updated ${lang}.json for addDestination`);
}
