const https = require('https');
const fs = require('fs');
https.get('https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Regular.ttf', (res) => {
  let data = [];
  res.on('data', (c) => data.push(c));
  res.on('end', () => {
    const b64 = Buffer.concat(data).toString('base64');
    fs.writeFileSync('src/utils/Roboto-Regular-normal.ts', 'export const RobotoRegular = `' + b64 + '`;');
    console.log('Done font');
  });
});
