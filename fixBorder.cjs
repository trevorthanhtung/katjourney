const fs = require('fs');

const cssFile = 'd:/02_PROJECTS/5_KAT JOURNEY/APP/src/styles.css';
let css = fs.readFileSync(cssFile, 'utf8');
if (!css.includes('--kat-border-rgb')) {
  css = css.replace('--kat-border: #E2E8F0;', '--kat-border: #E2E8F0;\n    --kat-border-rgb: 226 232 240;');
  css = css.replace('--kat-border: #2A3654;', '--kat-border: #2A3654;\n    --kat-border-rgb: 42 54 84;');
  fs.writeFileSync(cssFile, css);
}

const tailwindFile = 'd:/02_PROJECTS/5_KAT JOURNEY/APP/tailwind.config.js';
let tw = fs.readFileSync(tailwindFile, 'utf8');
if (!tw.includes('var(--kat-border-rgb)')) {
  tw = tw.replace('border: "var(--kat-border)",', 'border: "rgb(var(--kat-border-rgb) / <alpha-value>)",');
  fs.writeFileSync(tailwindFile, tw);
}

console.log('Fixed Tailwind Kat-Border issue!');
