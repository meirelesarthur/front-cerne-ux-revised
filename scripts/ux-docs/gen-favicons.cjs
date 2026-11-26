// scripts/ux-docs/gen-favicons.cjs
// Gera os PNGs do favicon e do app (public/icons/cerne/) a partir de
// public/favicon.svg (o "C" do CERNE, mesmo símbolo de src/assets/logo-min.svg).
// Uso: node scripts/ux-docs/gen-favicons.cjs   (precisa do Chrome instalado)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const SVG = fs.readFileSync(path.join(ROOT, 'public', 'favicon.svg'), 'utf8');
const OUT = path.join(ROOT, 'public', 'icons', 'cerne');
const SIZES = [16, 32, 48, 120, 152, 180, 192, 512];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  for (const size of SIZES) {
    await page.setViewportSize({ width: size, height: size });
    const svg = SVG.replace(/width="32" height="32"/, `width="${size}" height="${size}"`);
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await page.screenshot({ path: path.join(OUT, `${size}.png`), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
    console.log('ok', size);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
