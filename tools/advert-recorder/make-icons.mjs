// Renders full-bleed app icons (maskable for Android, apple-touch for iOS) from the store glyph.
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const out = new URL('../../public/', import.meta.url);
// Glyph is scaled to sit inside the central 80% "safe zone" so Android masks never clip it.
const svg = (scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2b65a"/><stop offset="1" stop-color="#c08f2c"/></linearGradient></defs>
  <rect width="64" height="64" fill="url(#g)"/>
  <g transform="translate(32 32) scale(${scale}) translate(-32 -32)" fill="none" stroke="#1a140c" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 26 18 15h28l4 11"/><path d="M14 26a6 6 0 0 0 12 0 6 6 0 0 0 12 0 6 6 0 0 0 12 0"/><path d="M17 31v18h30V31"/><path d="M27 49V39h10v10"/>
  </g></svg>`;
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
const p = await b.newPage();
for (const [name, size, scale] of [['icon-maskable-512.png', 512, 0.78], ['icon-maskable-192.png', 192, 0.78], ['apple-touch-icon.png', 180, 0.9]]) {
  await p.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await p.setContent(`<html><body style="margin:0;width:${size}px;height:${size}px">${svg(scale)}</body></html>`);
  fs.writeFileSync(new URL(name, out), await p.screenshot({ type: 'png', omitBackground: false }));
  console.log('wrote', name);
}
await b.close();
