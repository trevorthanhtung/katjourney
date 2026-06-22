export default async function handler(req, res) {
  try {
    const response = await fetch("https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx");
    if (!response.ok) {
      res.status(response.status).send("Failed to fetch exchange rates from Vietcombank");
      return;
    }
    const xml = await response.text();
    
    // Set headers: return XML, allow CORS, and cache on Vercel CDN for 4 hours
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=14400, stale-while-revalidate=3600");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    
    res.status(200).send(xml);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
