const fs = require("fs");
const path = require("path");

const translations = {
  en: {
    stats: {
      trips: "Trips",
      places: "Places",
      cities: "Cities",
      days: "Days",
      lastTrip: "Last Trip",
      tripsIn: "Trips in",
    },
    tooltip: {
      trip: "Trip",
      trips: "Trips",
      places: "Places",
      firstTrip: "First Trip",
      lastTrip: "Last Trip",
      hoangsa: "Hoàng Sa Islands",
      truongsa: "Trường Sa Islands",
      vietnam: "Vietnam",
    },
  },
  vi: {
    stats: {
      trips: "Chuyến đi",
      places: "Địa điểm",
      cities: "Thành phố",
      days: "Ngày",
      lastTrip: "Chuyến đi cuối",
      tripsIn: "Chuyến đi năm",
    },
    tooltip: {
      trip: "Chuyến",
      trips: "Chuyến",
      places: "Địa điểm",
      firstTrip: "Lần đầu đến",
      lastTrip: "Lần cuối đến",
      hoangsa: "Quần đảo Hoàng Sa",
      truongsa: "Quần đảo Trường Sa",
      vietnam: "Việt Nam",
    },
  },
  fr: {
    stats: {
      trips: "Voyages",
      places: "Lieux",
      cities: "Villes",
      days: "Jours",
      lastTrip: "Dernier voyage",
      tripsIn: "Voyages en",
    },
    tooltip: {
      trip: "Voyage",
      trips: "Voyages",
      places: "Lieux",
      firstTrip: "Premier voyage",
      lastTrip: "Dernier voyage",
      hoangsa: "Îles Hoàng Sa",
      truongsa: "Îles Trường Sa",
      vietnam: "Vietnam",
    },
  },
  es: {
    stats: {
      trips: "Viajes",
      places: "Lugares",
      cities: "Ciudades",
      days: "Días",
      lastTrip: "Último viaje",
      tripsIn: "Viajes en",
    },
    tooltip: {
      trip: "Viaje",
      trips: "Viajes",
      places: "Lugares",
      firstTrip: "Primer viaje",
      lastTrip: "Último viaje",
      hoangsa: "Islas Hoàng Sa",
      truongsa: "Islas Trường Sa",
      vietnam: "Vietnam",
    },
  },
  de: {
    stats: {
      trips: "Reisen",
      places: "Orte",
      cities: "Städte",
      days: "Tage",
      lastTrip: "Letzte Reise",
      tripsIn: "Reisen in",
    },
    tooltip: {
      trip: "Reise",
      trips: "Reisen",
      places: "Orte",
      firstTrip: "Erste Reise",
      lastTrip: "Letzte Reise",
      hoangsa: "Hoàng Sa Inseln",
      truongsa: "Trường Sa Inseln",
      vietnam: "Vietnam",
    },
  },
  it: {
    stats: {
      trips: "Viaggi",
      places: "Luoghi",
      cities: "Città",
      days: "Giorni",
      lastTrip: "Ultimo viaggio",
      tripsIn: "Viaggi nel",
    },
    tooltip: {
      trip: "Viaggio",
      trips: "Viaggi",
      places: "Luoghi",
      firstTrip: "Primo viaggio",
      lastTrip: "Ultimo viaggio",
      hoangsa: "Isole Hoàng Sa",
      truongsa: "Isole Trường Sa",
      vietnam: "Vietnam",
    },
  },
  pt: {
    stats: {
      trips: "Viagens",
      places: "Lugares",
      cities: "Cidades",
      days: "Dias",
      lastTrip: "Última viagem",
      tripsIn: "Viagens em",
    },
    tooltip: {
      trip: "Viagem",
      trips: "Viagens",
      places: "Lugares",
      firstTrip: "Primeira viagem",
      lastTrip: "Última viagem",
      hoangsa: "Ilhas Hoàng Sa",
      truongsa: "Ilhas Trường Sa",
      vietnam: "Vietnã",
    },
  },
  th: {
    stats: {
      trips: "ทริป",
      places: "สถานที่",
      cities: "เมือง",
      days: "วัน",
      lastTrip: "ทริปล่าสุด",
      tripsIn: "ทริปในปี",
    },
    tooltip: {
      trip: "ทริป",
      trips: "ทริป",
      places: "สถานที่",
      firstTrip: "ทริปแรก",
      lastTrip: "ทริปล่าสุด",
      hoangsa: "หมู่เกาะฮว่างซา",
      truongsa: "หมู่เกาะเจื่องซา",
      vietnam: "เวียดนาม",
    },
  },
  ja: {
    stats: {
      trips: "旅行",
      places: "場所",
      cities: "都市",
      days: "日数",
      lastTrip: "最後の旅行",
      tripsIn: "年の旅行",
    },
    tooltip: {
      trip: "旅行",
      trips: "旅行",
      places: "場所",
      firstTrip: "最初の旅行",
      lastTrip: "最後の旅行",
      hoangsa: "ホアンサ諸島",
      truongsa: "チュオンサ諸島",
      vietnam: "ベトナム",
    },
  },
  ko: {
    stats: {
      trips: "여행",
      places: "장소",
      cities: "도시",
      days: "일",
      lastTrip: "마지막 여행",
      tripsIn: "년의 여행",
    },
    tooltip: {
      trip: "여행",
      trips: "여행",
      places: "장소",
      firstTrip: "첫 여행",
      lastTrip: "마지막 여행",
      hoangsa: "호앙사 군도",
      truongsa: "쯔엉사 군도",
      vietnam: "베트남",
    },
  },
  zh: {
    stats: {
      trips: "旅行",
      places: "地点",
      cities: "城市",
      days: "天数",
      lastTrip: "最后旅行",
      tripsIn: "年的旅行",
    },
    tooltip: {
      trip: "旅行",
      trips: "旅行",
      places: "地点",
      firstTrip: "首次旅行",
      lastTrip: "最后旅行",
      hoangsa: "黄沙群岛",
      truongsa: "长沙群岛",
      vietnam: "越南",
    },
  },
  id: {
    stats: {
      trips: "Perjalanan",
      places: "Tempat",
      cities: "Kota",
      days: "Hari",
      lastTrip: "Perjalanan Terakhir",
      tripsIn: "Perjalanan di",
    },
    tooltip: {
      trip: "Perjalanan",
      trips: "Perjalanan",
      places: "Tempat",
      firstTrip: "Perjalanan Pertama",
      lastTrip: "Perjalanan Terakhir",
      hoangsa: "Kepulauan Hoàng Sa",
      truongsa: "Kepulauan Trường Sa",
      vietnam: "Vietnam",
    },
  },
};

const localesDir = path.join(__dirname, "src", "locales");

for (const lang of Object.keys(translations)) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    data.atlas = translations[lang];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang}.json`);
  } else {
    console.warn(`File not found: ${filePath}`);
  }
}
