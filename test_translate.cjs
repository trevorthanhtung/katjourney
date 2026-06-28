const https = require("https");

function translate(text, targetLang) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            let result = "";
            if (json && json[0]) {
              json[0].forEach((item) => {
                if (item[0]) result += item[0];
              });
            }
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

translate("Xin chào thế giới", "en").then(console.log).catch(console.error);
