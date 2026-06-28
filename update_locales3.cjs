const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "src", "locales");
const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));

const t_en = {
  compareLocation: "Compare with your location",
  yourLocation: "Your location",
  outdoorIdealTitle: "Ideal weather for outdoor activities",
  outdoorIdealDesc:
    "Sunny and clear skies. Great for going to the beach, hiking, camping or outdoor photography. Don't forget sunscreen and sunglasses!",
  coolPleasantTitle: "Cool and pleasant weather",
  coolPleasantDesc:
    "Cloudy and cool, not too hot. Great for walking around the old town, night markets, or sightseeing without getting exhausted.",
  foggyTitle: "Foggy weather, be careful on mountain passes",
  foggyDesc:
    "Cold air with beautiful fog. Perfect for romantic cafes and hot pot. If driving or riding a motorbike, use warning lights and drive slowly.",
  rainyTitle: "Rain showers, shift to indoor activities",
  rainyDesc:
    "Wet and rainy. You should prioritize visiting museums, indoor amusement parks, aquariums, cafes, or making souvenirs.",
  stormTitle: "Dangerous thunderstorms, stay indoors",
  stormDesc:
    "Bad weather with dangerous thunderstorms. Avoid boating, swimming, or going to the forest. Buy food and play board games or watch a movie in your room.",
  normalTitle: "Good weather for vacation",
  normalDesc:
    "Normal weather conditions. Follow the daily schedule to plan your activities reasonably.",
  uvLow: "Low",
  uvMedium: "Medium",
  uvHigh: "High",
  uvVeryHigh: "Very High",
  uvExtreme: "Extreme",
};

const t_ja = {
  compareLocation: "現在地と比較",
  yourLocation: "現在地",
  outdoorIdealTitle: "アウトドアに最適な天気",
  outdoorIdealDesc:
    "晴天です。ビーチ、ハイキング、キャンプ、写真撮影に最適です。日焼け止めとサングラスをお忘れなく！",
  coolPleasantTitle: "涼しくて快適な天気",
  coolPleasantDesc: "曇りで涼しく、暑すぎません。旧市街やナイトマーケットの散策、観光に最適です。",
  foggyTitle: "霧の天気、峠道に注意",
  foggyDesc:
    "冷たい空気と美しい霧。ロマンチックなカフェや鍋料理に最適です。運転する場合は警告灯を使用し、ゆっくり走ってください。",
  rainyTitle: "にわか雨、屋内のアクティビティに変更",
  rainyDesc: "雨で濡れています。博物館、屋内遊園地、水族館、カフェ、お土産作りを優先してください。",
  stormTitle: "危険な雷雨、屋内に留まってください",
  stormDesc:
    "危険な雷雨を伴う悪天候。ボート、水泳、森へ行くのは避けてください。食べ物を買って、部屋でボードゲームや映画を楽しんでください。",
  normalTitle: "休暇に良い天気",
  normalDesc:
    "通常の気象条件。毎日のスケジュールに従って、アクティビティを合理的に計画してください。",
  uvLow: "低い",
  uvMedium: "中程度",
  uvHigh: "高い",
  uvVeryHigh: "非常に高い",
  uvExtreme: "極端に高い",
};

const t_ko = {
  compareLocation: "현재 위치와 비교",
  yourLocation: "현재 위치",
  outdoorIdealTitle: "야외 활동하기 좋은 이상적인 날씨",
  outdoorIdealDesc:
    "맑고 화창한 하늘. 해변, 하이킹, 캠핑 또는 야외 사진 촬영에 좋습니다. 자외선 차단제와 선글라스를 잊지 마세요!",
  coolPleasantTitle: "시원하고 쾌적한 날씨",
  coolPleasantDesc:
    "흐리고 시원하며 너무 덥지 않습니다. 지치지 않고 구시가지, 야시장 또는 관광을 산책하기에 좋습니다.",
  foggyTitle: "안개 낀 날씨, 산길 주의",
  foggyDesc:
    "아름다운 안개와 차가운 공기. 로맨틱한 카페와 전골 요리에 완벽합니다. 운전이나 오토바이를 탈 경우 비상등을 켜고 천천히 운전하세요.",
  rainyTitle: "소나기, 실내 활동으로 전환",
  rainyDesc:
    "비가 오고 젖은 날씨. 박물관, 실내 놀이공원, 수족관, 카페 또는 기념품 만들기를 우선적으로 방문해야 합니다.",
  stormTitle: "위험한 뇌우, 실내에 머무르세요",
  stormDesc:
    "위험한 뇌우를 동반한 악천후. 보트 타기, 수영 또는 숲으로 가는 것을 피하세요. 음식을 사고 방에서 보드게임을 하거나 영화를 보세요.",
  normalTitle: "휴가에 좋은 날씨",
  normalDesc: "정상적인 기상 조건. 일일 일정에 따라 합리적으로 활동을 계획하세요.",
  uvLow: "낮음",
  uvMedium: "보통",
  uvHigh: "높음",
  uvVeryHigh: "매우 높음",
  uvExtreme: "극도로 높음",
};

const t_zh = {
  compareLocation: "与您当前位置比较",
  yourLocation: "您当前位置",
  outdoorIdealTitle: "适合户外活动的理想天气",
  outdoorIdealDesc: "晴朗无云。非常适合去海滩、远足、露营或户外摄影。别忘了防晒霜和太阳镜！",
  coolPleasantTitle: "凉爽宜人的天气",
  coolPleasantDesc: "多云凉爽，不会太热。非常适合在老城区、夜市散步，或者观光而不会感到疲惫。",
  foggyTitle: "雾天，在山口行驶请注意",
  foggyDesc:
    "寒冷的空气中带有美丽的雾气。非常适合浪漫的咖啡馆和火锅。如果开车或骑摩托车，请使用警告灯并减速慢行。",
  rainyTitle: "阵雨，转为室内活动",
  rainyDesc: "潮湿多雨。您应优先考虑参观博物馆、室内游乐园、水族馆、咖啡馆或制作纪念品。",
  stormTitle: "危险的雷暴，请留在室内",
  stormDesc:
    "伴有危险雷暴的恶劣天气。避免划船、游泳或去森林。买些食物，在房间里玩棋盘游戏或看电影。",
  normalTitle: "适合度假的好天气",
  normalDesc: "正常的天气条件。遵循每日日程表，合理规划您的活动。",
  uvLow: "低",
  uvMedium: "中",
  uvHigh: "高",
  uvVeryHigh: "很高",
  uvExtreme: "极高",
};

const t_th = {
  compareLocation: "เปรียบเทียบกับตำแหน่งของคุณ",
  yourLocation: "ตำแหน่งของคุณ",
  outdoorIdealTitle: "สภาพอากาศที่เหมาะสำหรับกิจกรรมกลางแจ้ง",
  outdoorIdealDesc:
    "ท้องฟ้าแจ่มใสและมีแดด เหมาะสำหรับการไปทะเล เดินป่า ตั้งแคมป์ หรือถ่ายภาพกลางแจ้ง อย่าลืมครีมกันแดดและแว่นกันแดด!",
  coolPleasantTitle: "สภาพอากาศที่เย็นสบาย",
  coolPleasantDesc:
    "มีเมฆและเย็นสบาย ไม่ร้อนเกินไป เหมาะสำหรับการเดินเล่นรอบเมืองเก่า ตลาดกลางคืน หรือชมทิวทัศน์โดยไม่เหนื่อยล้า",
  foggyTitle: "สภาพอากาศมีหมอก ระมัดระวังบนภูเขา",
  foggyDesc:
    "อากาศเย็นพร้อมหมอกที่สวยงาม เหมาะสำหรับคาเฟ่โรแมนติกและหม้อไฟ หากขับรถหรือขี่มอเตอร์ไซค์ ควรใช้ไฟฉุกเฉินและขับช้าๆ",
  rainyTitle: "มีฝนตก เปลี่ยนเป็นกิจกรรมในร่ม",
  rainyDesc:
    "เปียกและมีฝนตก คุณควรให้ความสำคัญกับการเยี่ยมชมพิพิธภัณฑ์ สวนสนุกในร่ม พิพิธภัณฑ์สัตว์น้ำ คาเฟ่ หรือทำของที่ระลึก",
  stormTitle: "พายุฝนฟ้าคะนองอันตราย ควรอยู่ในที่ร่ม",
  stormDesc:
    "สภาพอากาศเลวร้ายพร้อมพายุฝนฟ้าคะนองอันตราย หลีกเลี่ยงการพายเรือ ว่ายน้ำ หรือไปที่ป่า ซื้ออาหารและเล่นบอร์ดเกมหรือดูหนังในห้องของคุณ",
  normalTitle: "สภาพอากาศดีสำหรับการพักผ่อน",
  normalDesc: "สภาพอากาศปกติ ติดตามกำหนดการประจำวันเพื่อวางแผนกิจกรรมของคุณอย่างสมเหตุสมผล",
  uvLow: "ต่ำ",
  uvMedium: "ปานกลาง",
  uvHigh: "สูง",
  uvVeryHigh: "สูงมาก",
  uvExtreme: "สูงจัด",
};

const dict = {
  en: t_en,
  ja: t_ja,
  ko: t_ko,
  zh: t_zh,
  th: t_th,
};

for (const file of files) {
  const lang = file.replace(".json", "");
  // Skip vi.json as it already has the exact original keys translated properly
  if (lang === "vi") continue;

  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!data.weather) data.weather = {};

  const trans = dict[lang] || t_en;

  for (const [k, v] of Object.entries(trans)) {
    data.weather[k] = v;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Updated ${file}`);
}
