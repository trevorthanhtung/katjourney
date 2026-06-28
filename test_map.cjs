const d3 = require("d3-geo");
const topojson = require("topojson-client");
const fs = require("fs");
const https = require("https");

https.get("https://unpkg.com/world-atlas@2.0.2/countries-110m.json", (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    const topology = JSON.parse(data);
    const geojson = topojson.feature(topology, topology.objects.countries);

    const proj = d3.geoMercator().scale(159.154943).center([0, 15]).translate([800, 450]);
    const path = d3.geoPath().projection(proj);

    let minX = Infinity,
      maxX = -Infinity;
    geojson.features.forEach((f) => {
      const bounds = path.bounds(f);
      if (bounds[0][0] < minX) minX = bounds[0][0];
      if (bounds[1][0] > maxX) maxX = bounds[1][0];
      if (f.properties.name === "United States of America") {
        console.log("USA bounds:", bounds);
      }
    });
    console.log("Map X span:", minX, maxX);
    console.log("Map width:", maxX - minX);
  });
});
