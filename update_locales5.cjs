const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "src", "locales");
const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));

const t_es = {
  compareLocation: "Comparar con tu ubicación",
  yourLocation: "Tu ubicación",
  outdoorIdealTitle: "Clima ideal para actividades al aire libre",
  outdoorIdealDesc:
    "Cielos soleados y despejados. Ideal para ir a la playa, hacer senderismo, acampar o fotografía al aire libre. ¡No olvides el protector solar y las gafas de sol!",
  coolPleasantTitle: "Clima fresco y agradable",
  coolPleasantDesc:
    "Nublado y fresco, sin hacer demasiado calor. Ideal para pasear por el casco antiguo, los mercados nocturnos o hacer turismo sin agotarse.",
  foggyTitle: "Clima con niebla, cuidado en los pasos de montaña",
  foggyDesc:
    "Aire frío con hermosa niebla. Perfecto para cafeterías románticas y estofados. Si conduces un coche o una moto, usa las luces de advertencia y conduce despacio.",
  rainyTitle: "Chubascos, cambia a actividades de interior",
  rainyDesc:
    "Húmedo y lluvioso. Deberías priorizar visitar museos, parques de atracciones cubiertos, acuarios, cafeterías o hacer recuerdos.",
  stormTitle: "Tormentas eléctricas peligrosas, quédate en el interior",
  stormDesc:
    "Mal tiempo con tormentas eléctricas peligrosas. Evita navegar, nadar o ir al bosque. Compra comida y juega a juegos de mesa o mira una película en tu habitación.",
  normalTitle: "Buen clima para las vacaciones",
  normalDesc:
    "Condiciones climáticas normales. Siga el horario diario para planificar tus actividades razonablemente.",
  uvLow: "Bajo",
  uvMedium: "Medio",
  uvHigh: "Alto",
  uvVeryHigh: "Muy alto",
  uvExtreme: "Extremo",
};

const t_fr = {
  compareLocation: "Comparer avec votre position",
  yourLocation: "Votre position",
  outdoorIdealTitle: "Météo idéale pour les activités de plein air",
  outdoorIdealDesc:
    "Ciel ensoleillé et dégagé. Idéal pour aller à la plage, faire de la randonnée, camper ou faire de la photographie en plein air. N'oubliez pas la crème solaire et les lunettes de soleil !",
  coolPleasantTitle: "Temps frais et agréable",
  coolPleasantDesc:
    "Nuageux et frais, pas trop chaud. Idéal pour se promener dans la vieille ville, les marchés nocturnes ou faire du tourisme sans s'épuiser.",
  foggyTitle: "Temps brumeux, soyez prudent sur les cols de montagne",
  foggyDesc:
    "Air froid avec un beau brouillard. Parfait pour les cafés romantiques et les fondues. Si vous conduisez, utilisez les feux de détresse et roulez lentement.",
  rainyTitle: "Averses, passez aux activités d'intérieur",
  rainyDesc:
    "Humide et pluvieux. Vous devriez privilégier la visite de musées, de parcs d'attractions couverts, d'aquariums, de cafés ou la fabrication de souvenirs.",
  stormTitle: "Orages dangereux, restez à l'intérieur",
  stormDesc:
    "Mauvais temps avec des orages dangereux. Évitez de faire du bateau, de nager ou d'aller dans la forêt. Achetez de la nourriture et jouez à des jeux de société ou regardez un film.",
  normalTitle: "Beau temps pour les vacances",
  normalDesc:
    "Conditions météorologiques normales. Suivez le programme quotidien pour planifier raisonnablement vos activités.",
  uvLow: "Faible",
  uvMedium: "Moyen",
  uvHigh: "Élevé",
  uvVeryHigh: "Très élevé",
  uvExtreme: "Extrême",
};

const t_de = {
  compareLocation: "Mit Ihrem Standort vergleichen",
  yourLocation: "Ihr Standort",
  outdoorIdealTitle: "Ideales Wetter für Outdoor-Aktivitäten",
  outdoorIdealDesc:
    "Sonnig und klarer Himmel. Ideal für den Strand, Wandern, Camping oder Outdoor-Fotografie. Vergessen Sie Sonnencreme und Sonnenbrille nicht!",
  coolPleasantTitle: "Kühles und angenehmes Wetter",
  coolPleasantDesc:
    "Bewölkt und kühl, nicht zu heiß. Ideal, um durch die Altstadt oder über Nachtmärkte zu schlendern oder Sehenswürdigkeiten zu besichtigen.",
  foggyTitle: "Nebliges Wetter, Vorsicht auf Bergpässen",
  foggyDesc:
    "Kalte Luft mit wunderschönem Nebel. Perfekt für romantische Cafés und Hot Pot. Wenn Sie Auto oder Motorrad fahren, schalten Sie die Warnblinkanlage ein und fahren Sie langsam.",
  rainyTitle: "Regenschauer, auf Indoor-Aktivitäten ausweichen",
  rainyDesc:
    "Nass und regnerisch. Sie sollten Museen, Indoor-Vergnügungsparks, Aquarien, Cafés oder Souvenirgeschäfte bevorzugen.",
  stormTitle: "Gefährliche Gewitter, bleiben Sie drinnen",
  stormDesc:
    "Schlechtes Wetter mit gefährlichen Gewittern. Vermeiden Sie Bootfahren, Schwimmen oder Ausflüge in den Wald. Kaufen Sie Lebensmittel und spielen Sie Brettspiele oder schauen Sie einen Film auf Ihrem Zimmer.",
  normalTitle: "Gutes Wetter für den Urlaub",
  normalDesc:
    "Normale Wetterbedingungen. Folgen Sie dem Tagesplan, um Ihre Aktivitäten sinnvoll zu planen.",
  uvLow: "Niedrig",
  uvMedium: "Mittel",
  uvHigh: "Hoch",
  uvVeryHigh: "Sehr hoch",
  uvExtreme: "Extrem",
};

const t_it = {
  compareLocation: "Confronta con la tua posizione",
  yourLocation: "La tua posizione",
  outdoorIdealTitle: "Tempo ideale per attività all'aperto",
  outdoorIdealDesc:
    "Cielo soleggiato e sereno. Ottimo per andare in spiaggia, fare escursioni, campeggio o fotografia all'aperto. Non dimenticare crema solare e occhiali da sole!",
  coolPleasantTitle: "Tempo fresco e piacevole",
  coolPleasantDesc:
    "Nuvoloso e fresco, non troppo caldo. Ottimo per passeggiare nel centro storico, nei mercati notturni o fare visite turistiche senza stancarsi.",
  foggyTitle: "Tempo nebbioso, fare attenzione sui passi di montagna",
  foggyDesc:
    "Aria fredda con nebbia bellissima. Perfetto per caffè romantici e pentole calde. Se guidi, usa le luci di emergenza e guida lentamente.",
  rainyTitle: "Rovesci, passa ad attività al coperto",
  rainyDesc:
    "Umido e piovoso. Dovresti dare priorità a musei, parchi divertimento al coperto, acquari, caffè o creare souvenir.",
  stormTitle: "Temporali pericolosi, resta al chiuso",
  stormDesc:
    "Brutto tempo con temporali pericolosi. Evita di andare in barca, nuotare o andare nella foresta. Compra del cibo e gioca a giochi da tavolo o guarda un film in camera.",
  normalTitle: "Bel tempo per le vacanze",
  normalDesc:
    "Condizioni meteorologiche normali. Segui il programma giornaliero per pianificare le tue attività in modo ragionevole.",
  uvLow: "Basso",
  uvMedium: "Medio",
  uvHigh: "Alto",
  uvVeryHigh: "Molto alto",
  uvExtreme: "Estremo",
};

const t_pt = {
  compareLocation: "Comparar com a sua localização",
  yourLocation: "Sua localização",
  outdoorIdealTitle: "Clima ideal para atividades ao ar livre",
  outdoorIdealDesc:
    "Céu ensolarado e limpo. Ótimo para ir à praia, fazer trilhas, acampar ou tirar fotos ao ar livre. Não esqueça do protetor solar e óculos de sol!",
  coolPleasantTitle: "Clima fresco e agradável",
  coolPleasantDesc:
    "Nublado e fresco, sem muito calor. Ótimo para passear pelo centro histórico, mercados noturnos ou visitar pontos turísticos sem se cansar.",
  foggyTitle: "Clima nublado, cuidado nas serras",
  foggyDesc:
    "Ar frio com uma linda neblina. Perfeito para cafés românticos e fondue. Se for dirigir ou andar de moto, use o pisca-alerta e dirija devagar.",
  rainyTitle: "Pancadas de chuva, mude para atividades internas",
  rainyDesc:
    "Úmido e chuvoso. Você deve priorizar visitas a museus, parques de diversões indoor, aquários, cafés ou fazer lembrancinhas.",
  stormTitle: "Tempestades perigosas, fique em locais fechados",
  stormDesc:
    "Mau tempo com tempestades perigosas. Evite andar de barco, nadar ou ir para a floresta. Compre comida e jogue jogos de tabuleiro ou assista a um filme no seu quarto.",
  normalTitle: "Bom clima para férias",
  normalDesc:
    "Condições climáticas normais. Siga a programação diária para planejar suas atividades de forma razoável.",
  uvLow: "Baixo",
  uvMedium: "Médio",
  uvHigh: "Alto",
  uvVeryHigh: "Muito alto",
  uvExtreme: "Extremo",
};

const t_id = {
  compareLocation: "Bandingkan dengan lokasi Anda",
  yourLocation: "Lokasi Anda",
  outdoorIdealTitle: "Cuaca ideal untuk aktivitas luar ruangan",
  outdoorIdealDesc:
    "Cerah dan langit bersih. Cocok untuk pergi ke pantai, mendaki gunung, berkemah, atau fotografi luar ruangan. Jangan lupa tabir surya dan kacamata hitam!",
  coolPleasantTitle: "Cuaca sejuk dan menyenangkan",
  coolPleasantDesc:
    "Berawan dan sejuk, tidak terlalu panas. Bagus untuk berjalan-jalan di kota tua, pasar malam, atau jalan-jalan tanpa merasa kelelahan.",
  foggyTitle: "Cuaca berkabut, hati-hati di jalur pegunungan",
  foggyDesc:
    "Udara dingin dengan kabut yang indah. Sempurna untuk kafe romantis dan hot pot. Jika mengemudi, gunakan lampu peringatan dan berkendara perlahan.",
  rainyTitle: "Hujan, beralih ke aktivitas dalam ruangan",
  rainyDesc:
    "Basah dan hujan. Anda harus memprioritaskan mengunjungi museum, taman hiburan dalam ruangan, akuarium, kafe, atau membuat suvenir.",
  stormTitle: "Badai petir berbahaya, tetap di dalam ruangan",
  stormDesc:
    "Cuaca buruk dengan badai petir yang berbahaya. Hindari berperahu, berenang, atau pergi ke hutan. Beli makanan dan mainkan permainan papan atau tonton film di kamar.",
  normalTitle: "Cuaca bagus untuk liburan",
  normalDesc:
    "Kondisi cuaca normal. Ikuti jadwal harian untuk merencanakan aktivitas Anda dengan masuk akal.",
  uvLow: "Rendah",
  uvMedium: "Sedang",
  uvHigh: "Tinggi",
  uvVeryHigh: "Sangat Tinggi",
  uvExtreme: "Ekstrem",
};

const dict = { es: t_es, fr: t_fr, de: t_de, it: t_it, pt: t_pt, id: t_id };

for (const file of files) {
  const lang = file.replace(".json", "");
  if (!dict[lang]) continue;

  const filePath = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!data.weather) data.weather = {};

  for (const [k, v] of Object.entries(dict[lang])) {
    data.weather[k] = v;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Updated ${file} with full translation`);
}
