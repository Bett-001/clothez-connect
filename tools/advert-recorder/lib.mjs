// Clotz Hub advert recorder library.
// The live app is captured frame by frame at phone resolution, composited into a glossy phone
// on an animated stage (a second browser), and piped to ffmpeg as 4K H.264.
import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import fs from 'fs';

const [, , layout = 'vertical', OUT = 'out/advert.mp4', ...flags] = process.argv;
export const PREVIEW = flags.includes('--preview');
export const NO_ORDER = flags.includes('--no-order');
export const FAST = flags.includes('--fast');            // punchy TikTok cut
export const VERTICAL = layout === 'vertical';
export const BASE = 'https://clotzhub.vercel.app';
const SUPA = 'https://iruvuhzriqqkcjhblakk.supabase.co';
const KEY = 'sb_publishable_35dcsTJPz-B0S-HShdTD8Q_pm6w-fR0';
const STORAGE_KEY = 'sb-iruvuhzriqqkcjhblakk-auth-token';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FPS = 30;
const SPEED = FAST ? 0.6 : 1;                             // multiplies holds and camera moves
export const sec = s => s * SPEED;
export const env = Object.fromEntries(
  fs.readFileSync(new URL('./accounts.env', import.meta.url), 'utf8').trim().split('\n').map(l => l.split(/=(.*)/s).slice(0, 2)),
);

// ---------------------------------------------------------------- geometry
const STAGE = VERTICAL ? { w: 1080, h: 1920 } : { w: 1920, h: 1080 };
const SDPR = PREVIEW ? 0.5 : 2;                           // 2 => 2160x3840 / 3840x2160
export const W = STAGE.w * SDPR, H = STAGE.h * SDPR;
const APP = { w: 393, h: 798 };                           // app viewport (iPhone 15 minus status bar)
const SCREEN_W = VERTICAL ? 590 : 415;                    // phone screen width in stage px
const SCREEN_H = Math.round(SCREEN_W * 852 / 393);
const STATUS_H = SCREEN_H - Math.round(SCREEN_W * APP.h / APP.w);
const APP_DPR = (SCREEN_W * SDPR) / APP.w;                // app pixels map 1:1 onto the stage
export const view = { width: APP.w, height: APP.h, deviceScaleFactor: APP_DPR, isMobile: true, hasTouch: true };
const APPW = Math.round(APP.w * APP_DPR), APPH = Math.round(APP.h * APP_DPR);

// ---------------------------------------------------------------- ffmpeg
const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-vf', `scale=${W}:${H}:flags=lanczos:in_color_matrix=bt601:out_color_matrix=bt709:in_range=full:out_range=tv,format=yuv420p`,
  '-c:v', 'libx264', '-preset', PREVIEW ? 'veryfast' : 'slow', '-crf', PREVIEW ? '23' : '11',
  '-x264-params', 'aq-mode=3:aq-strength=0.8', '-profile:v', 'high', '-level', '5.2',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  '-movflags', '+faststart', '-r', String(FPS), OUT,
], { stdio: ['pipe', 'inherit', 'inherit'] });
export let frames = 0;
const write = buf => new Promise(res => (ff.stdin.write(buf) ? res() : ff.stdin.once('drain', res)));

export const sleep = ms => new Promise(r => setTimeout(r, ms));
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const spring = t => 1 - Math.exp(-6 * t) * Math.cos(9 * t);   // overshoots then settles at 1
const nf = s => Math.max(1, Math.round(s * FPS));
export const log = (...a) => console.log(`[${(frames / FPS).toFixed(1)}s]`, ...a);

export async function signIn(email, password) {
  const r = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  });
  const s = await r.json();
  if (!s.access_token) throw new Error('sign-in failed for ' + email + ': ' + JSON.stringify(s));
  s.expires_at ??= Math.floor(Date.now() / 1000) + s.expires_in;
  return s;
}

const launch = () => puppeteer.launch({
  executablePath: CHROME, headless: 'new', protocolTimeout: 90000,
  args: ['--hide-scrollbars', '--font-render-hinting=none', '--force-color-profile=srgb'],
});
export const browser = await launch();          // app pages
const stageBrowser = await launch();            // separate, so the app tab never loses focus (background tabs stop painting)

// ---------------------------------------------------------------- the stage
const LOGO_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="#141210" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/></svg>`;

const BZ = Math.round(SCREEN_W * 0.042);
const EDGE = Math.max(4, Math.round(SCREEN_W * 0.011));
const PHONE_W = SCREEN_W + 2 * (BZ + EDGE), PHONE_H = SCREEN_H + 2 * (BZ + EDGE);
const PHONE_X = VERTICAL ? (STAGE.w - PHONE_W) / 2 : 640 - PHONE_W / 2;
const PHONE_Y = VERTICAL ? 470 : (STAGE.h - PHONE_H) / 2;

const stageHTML = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box} html,body{margin:0;width:${STAGE.w}px;height:${STAGE.h}px;overflow:hidden;background:#0b0907}
#bg{position:absolute;inset:0}
.spark{position:absolute;border-radius:50%;background:radial-gradient(circle,#fff6d6 0%,rgba(245,210,122,.8) 35%,rgba(245,210,122,0) 70%)}
#glow{position:absolute;left:${PHONE_X + PHONE_W / 2 - PHONE_W * 1.1}px;top:${PHONE_Y + PHONE_H / 2 - PHONE_H * 0.75}px;width:${PHONE_W * 2.2}px;height:${PHONE_H * 1.5}px;
  background:radial-gradient(ellipse at center,rgba(226,176,74,.32) 0%,rgba(226,176,74,.10) 40%,rgba(226,176,74,0) 70%)}
#phone{position:absolute;left:${PHONE_X}px;top:${PHONE_Y}px;width:${PHONE_W}px;height:${PHONE_H}px;border-radius:${SCREEN_W * 0.19}px;padding:${EDGE}px;transform-origin:50% 50%;
  background:linear-gradient(140deg,#f2f2f4 0%,#77777d 18%,#2c2c30 34%,#9a9aa0 52%,#3a3a3f 70%,#d6d6db 88%,#6d6d72 100%);
  box-shadow:0 ${PHONE_H * 0.06}px ${PHONE_H * 0.12}px rgba(0,0,0,.65),0 ${PHONE_H * 0.015}px ${PHONE_H * 0.03}px rgba(0,0,0,.5),0 0 ${PHONE_W * 0.5}px rgba(226,176,74,.2)}
#bezel{width:100%;height:100%;border-radius:${SCREEN_W * 0.175}px;background:#050505;padding:${BZ}px;position:relative;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.08)}
#screen{width:${SCREEN_W}px;height:${SCREEN_H}px;border-radius:${SCREEN_W * 0.135}px;overflow:hidden;position:relative;background:#121110}
#status{height:${STATUS_H}px;background:#141210;display:flex;align-items:center;justify-content:space-between;padding:0 ${SCREEN_W * 0.085}px;color:#f3efe6;
  font:600 ${STATUS_H * 0.32}px/1 -apple-system,'SF Pro Text','Outfit',sans-serif}
#island{position:absolute;left:50%;top:${STATUS_H * 0.2}px;transform:translateX(-50%);width:${SCREEN_W * 0.31}px;height:${STATUS_H * 0.6}px;border-radius:999px;background:#000;z-index:3}
#app{display:block;width:${SCREEN_W}px;height:${SCREEN_H - STATUS_H}px}
#glare{position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:4;background:linear-gradient(128deg,rgba(255,255,255,.09) 0%,rgba(255,255,255,.03) 22%,rgba(255,255,255,0) 40%)}
#sweep{position:absolute;inset:-20%;pointer-events:none;z-index:5;opacity:0;background:linear-gradient(105deg,rgba(255,255,255,0) 42%,rgba(255,255,255,.18) 50%,rgba(255,255,255,0) 58%)}
.btn{position:absolute;width:${EDGE + 2}px;background:linear-gradient(90deg,#5c5c61,#b9b9be,#5c5c61);border-radius:2px}
#reflect{position:absolute;left:${PHONE_X}px;top:${PHONE_Y + PHONE_H + 8}px;width:${PHONE_W}px;height:${PHONE_H * 0.12}px;border-radius:50%;
  background:radial-gradient(ellipse at center top,rgba(226,176,74,.24),rgba(226,176,74,0) 70%);filter:blur(6px)}
#kicker{position:absolute;display:flex;align-items:center;gap:16px;font:700 24px/1 'Outfit',sans-serif;letter-spacing:.32em;color:#e2b04a;text-transform:uppercase}
#kicker .lg{width:54px;height:54px;border-radius:24%;background:linear-gradient(135deg,#f7da8a,#c8962c);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 30px rgba(226,176,74,.35)}
#kicker .lg svg{width:58%;height:58%}
.gold{background:linear-gradient(110deg,#e9b955 0%,#fff3cf 30%,#f0c566 50%,#fff8e3 68%,#d9a43e 100%);background-size:250% 100%;
  -webkit-background-clip:text;background-clip:text;color:transparent}
.emo{font-family:'Apple Color Emoji','Segoe UI Emoji',sans-serif;font-weight:400}
#cap{position:absolute;font:${FAST ? 800 : 700} ${VERTICAL ? (FAST ? 78 : 70) : 96}px/1.08 ${FAST ? "'Outfit',sans-serif" : "'Playfair Display',serif"};letter-spacing:${FAST ? '-.02em' : '-.01em'};
  filter:drop-shadow(0 6px 24px rgba(0,0,0,.6));transform-origin:${VERTICAL ? '50% 50%' : '0% 50%'}}
#rule{position:absolute;height:3px;border-radius:3px;background:linear-gradient(90deg,#e2b04a,rgba(226,176,74,0))}
#url{position:absolute;font:500 28px/1 'Outfit',sans-serif;color:#cdbf9f;letter-spacing:.04em}
#card{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 7%;opacity:0}
#card .lg{width:${VERTICAL ? 170 : 190}px;height:${VERTICAL ? 170 : 190}px;border-radius:24%;background:linear-gradient(135deg,#f9e09a,#c8962c);display:flex;align-items:center;justify-content:center;
  margin-bottom:${VERTICAL ? 56 : 54}px;box-shadow:0 30px 90px rgba(226,176,74,.45),inset 0 2px 0 rgba(255,255,255,.5)}
#card .lg svg{width:56%;height:56%}
#ct{font:${FAST ? 800 : 700} ${VERTICAL ? (FAST ? 112 : 120) : 150}px/1.04 ${FAST ? "'Outfit',sans-serif" : "'Playfair Display',serif"};letter-spacing:${FAST ? '-.03em' : '0'};white-space:pre-line;margin:0 0 ${VERTICAL ? 36 : 30}px;
  filter:drop-shadow(0 10px 40px rgba(0,0,0,.6))}
#ct .gold{background:linear-gradient(110deg,#d9a43e 0%,#f6d27e 25%,#fffaf0 42%,#f6d27e 58%,#c8962c 100%);background-size:260% 100%;-webkit-background-clip:text;background-clip:text}
#cs{font:600 ${VERTICAL ? 46 : 46}px/1.35 'Outfit',sans-serif;color:#efe6d2;white-space:pre-line}
#flash{position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 45%,rgba(255,250,235,.95) 0%,rgba(250,215,130,.7) 35%,rgba(226,176,74,.25) 70%,rgba(226,176,74,0) 100%)}
</style></head><body>
<div id="bg"></div><div id="sparks"></div><div id="glow"></div><div id="reflect"></div>
<div id="phone"><div class="btn" style="left:-${EDGE}px;top:${PHONE_H * 0.17}px;height:${PHONE_H * 0.035}px"></div>
  <div class="btn" style="left:-${EDGE}px;top:${PHONE_H * 0.24}px;height:${PHONE_H * 0.065}px"></div>
  <div class="btn" style="left:-${EDGE}px;top:${PHONE_H * 0.32}px;height:${PHONE_H * 0.065}px"></div>
  <div class="btn" style="right:-${EDGE}px;top:${PHONE_H * 0.26}px;height:${PHONE_H * 0.1}px"></div>
  <div id="bezel"><div id="screen"><div id="island"></div>
    <div id="status"><span>9:41</span><span style="display:flex;gap:${STATUS_H * 0.12}px;align-items:center">
      <svg height="${STATUS_H * 0.26}" viewBox="0 0 18 12" fill="#f3efe6"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
      <svg height="${STATUS_H * 0.27}" viewBox="0 0 26 13"><rect x=".5" y=".5" width="22" height="12" rx="3.5" fill="none" stroke="#f3efe6" opacity=".5"/><rect x="2.5" y="2.5" width="16" height="8" rx="2" fill="#f3efe6"/><rect x="23.5" y="4.5" width="2" height="4" rx="1" fill="#f3efe6" opacity=".5"/></svg>
    </span></div>
    <img id="app"><div id="glare"></div><div id="sweep"></div></div></div></div>
<div id="kicker"><div class="lg">${LOGO_SVG}</div>Clotz Hub</div>
<div id="cap"></div><div id="rule"></div><div id="url">clotzhub.vercel.app</div>
<div id="card"><div class="lg">${LOGO_SVG}</div><div id="ct"></div><div id="cs"></div></div>
<div id="flash"></div>
<script>
const V=${VERTICAL}, SW=${STAGE.w}, SH=${STAGE.h};
const sparks=[]; const host=document.getElementById('sparks');
for(let i=0;i<40;i++){const d=document.createElement('div');d.className='spark';host.appendChild(d);
  sparks.push({el:d,x:Math.random()*SW,y:Math.random()*SH,s:3+Math.random()*8,v:6+Math.random()*18,p:Math.random()*6.28,f:.4+Math.random()*1.3});}
const $=id=>document.getElementById(id);
const cap=$('cap'),rule=$('rule'),kick=$('kicker'),url=$('url');
if(V){ kick.style.cssText+='left:50%;top:150px;transform:translateX(-50%)';
  cap.style.cssText+='left:50px;right:50px;top:240px;text-align:center';
  rule.style.cssText+='display:none'; url.style.cssText+='left:0;right:0;text-align:center;top:${PHONE_Y + PHONE_H + 34}px'; }
else { kick.style.cssText+='left:1070px;top:200px'; cap.style.cssText+='left:1070px;width:760px;top:390px';
  rule.style.cssText+='left:1070px;width:260px;top:360px'; url.style.cssText+='left:1070px;top:880px'; }
// Gradient text can't colour emoji, so emoji are split into their own spans.
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const rich=txt=>txt.split(/(\\p{Extended_Pictographic}(?:\\uFE0F|\\u200D\\p{Extended_Pictographic})*|\\p{Regional_Indicator}{2})/u)
  .map((p,i)=>!p?'':(i%2?'<span class="emo">'+p+'</span>':'<span class="gold">'+esc(p)+'</span>')).join('');
let lastImg=null, capText=null, ctText=null;
window.render=async(st)=>{
  const t=st.t;
  const b1x=30+12*Math.sin(t*.23), b1y=25+10*Math.cos(t*.19), b2x=78+10*Math.cos(t*.17), b2y=70+12*Math.sin(t*.21), b3x=55+20*Math.sin(t*.11);
  $('bg').style.background='radial-gradient(circle at '+b1x+'% '+b1y+'%,rgba(214,160,60,.32),rgba(214,160,60,0) 42%),'+
    'radial-gradient(circle at '+b2x+'% '+b2y+'%,rgba(247,214,128,.17),rgba(247,214,128,0) 38%),'+
    'radial-gradient(ellipse at '+b3x+'% 95%,rgba(130,72,18,.45),rgba(130,72,18,0) 55%),'+
    'radial-gradient(ellipse at 50% 50%,#1b1610 0%,#0e0c09 60%,#070605 100%)';
  for(const s of sparks){const y=((s.y - t*s.v)%SH+SH)%SH, o=Math.max(0,Math.sin(t*s.f+s.p))**3*.95;
    s.el.style.cssText='left:'+(s.x+8*Math.sin(t*.5+s.p))+'px;top:'+y+'px;width:'+s.s+'px;height:'+s.s+'px;opacity:'+o;}
  const ph=$('phone'), po=st.phone.o, py=Math.round((st.phone.y + 5*Math.sin(t*.9))*2)/2, ps=st.phone.s;
  ph.style.opacity=po; ph.style.transform='translateY('+py+'px)'+(Math.abs(ps-1)>.0005?' scale('+ps+')':'');
  $('glow').style.opacity=po*(.85+.15*Math.sin(t*.7)); $('reflect').style.opacity=po; $('reflect').style.transform='translateY('+py+'px)';
  const sw=(t%5)/1.3; const sweep=$('sweep');
  if(sw<1){sweep.style.opacity=1;sweep.style.transform='translateX('+(-60+130*sw)+'%)';} else sweep.style.opacity=0;
  if(st.img && st.img!==lastImg){ const im=$('app'); im.src='data:image/jpeg;base64,'+st.img; lastImg=st.img; try{await im.decode();}catch(e){} }
  if(capText!==st.cap.text){ cap.innerHTML=rich(st.cap.text); capText=st.cap.text; }
  const co=st.cap.o, cs=st.cap.s; cap.style.opacity=Math.min(1,co); cap.style.transform='translateY('+((1-Math.min(1,co))*28)+'px) scale('+cs+')';
  for(const g of cap.querySelectorAll('.gold')) g.style.backgroundPosition=(100-((t*18)%200))+'% 0';
  rule.style.opacity=Math.min(1,co); rule.style.transform='scaleX('+Math.min(1,co)+')'; rule.style.transformOrigin='left';
  kick.style.opacity=st.ui; url.style.opacity=st.ui*.9;
  const c=$('card'); c.style.opacity=st.card.o; c.style.transform='scale('+st.card.s+')';
  if(ctText!==st.card.title){ $('ct').innerHTML=rich(st.card.title); ctText=st.card.title; }
  if($('cs').textContent!==st.card.sub) $('cs').textContent=st.card.sub;
  for(const g of $('ct').querySelectorAll('.gold')) g.style.backgroundPosition=(130-((t*30)%260))+'% 0';
  $('flash').style.opacity=st.flash;
};
</script></body></html>`;

const stagePage = (await stageBrowser.pages())[0] ?? await stageBrowser.newPage();
await stagePage.setViewport({ width: STAGE.w, height: STAGE.h, deviceScaleFactor: SDPR });
await stagePage.setContent(stageHTML, { waitUntil: 'networkidle0' });
await stagePage.evaluate(() => document.fonts.ready);

const st = { phone: { o: 0, y: 60, s: 1 }, cap: { text: '', o: 0, s: 1 }, card: { title: '', sub: '', o: 0, s: 1 }, ui: 0, flash: 0 };
let pendingImg = null;
let flashLeft = 0;            // frames remaining in the current flash
async function stageFrame() {
  if (flashLeft > 0) { flashLeft--; st.flash = 0.75 * Math.pow(flashLeft / 7, 1.6); } else st.flash = 0;
  const img = pendingImg; pendingImg = null;
  await stagePage.evaluate(s => window.render(s), { ...st, t: frames / FPS, img });
  const buf = await stagePage.screenshot({ type: 'jpeg', quality: PREVIEW ? 80 : 96, optimizeForSpeed: true, captureBeyondViewport: false });
  await write(buf); frames++;
}
export function flash() { if (FAST) flashLeft = 8; }

// ---------------------------------------------------------------- app pages
const APP_CSS = `
  ::-webkit-scrollbar { display: none !important; }
  html { scroll-behavior: auto !important; }
  #rec-ripple { position: fixed; z-index: 2147483647; border-radius: 50%; pointer-events: none; opacity: 0;
    border: 3px solid rgba(255,255,255,.95); background: rgba(212,163,54,.38); box-shadow: 0 0 0 2px rgba(0,0,0,.25), 0 0 26px rgba(245,210,122,.7); }
  #rec-fade { position: fixed; inset: 0; z-index: 2147483645; pointer-events: none; width: 100vw; height: 100vh; object-fit: cover; }
`;

export async function newPage(session) {
  const page = await browser.newPage();
  await page.bringToFront();
  await page.setViewport(view);
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1');
  // Product photos are stored at 600px; ask the image CDN for 3x so they stay sharp in 4K.
  await page.setRequestInterception(true);
  page.on('request', r => {
    const u = r.url();
    if (u.startsWith('https://images.unsplash.com/')) {
      const url = new URL(u);
      for (const k of ['w', 'h']) { const v = Number(url.searchParams.get(k)); if (v) url.searchParams.set(k, String(Math.min(3200, v * 3))); }
      url.searchParams.set('q', '90');
      return r.continue({ url: url.toString() });
    }
    r.continue();
  });
  await page.evaluateOnNewDocument((k, v, css) => {
    if (v) localStorage.setItem(k, v);
    const add = () => { if (!document.getElementById('rec-style')) { const s = document.createElement('style'); s.id = 'rec-style'; s.textContent = css; document.head.appendChild(s); } };
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', add) : add();
  }, STORAGE_KEY, session ? JSON.stringify(session) : null, APP_CSS);
  page.on('pageerror', e => console.log('  PAGEERROR', e.message));
  page.on('dialog', d => d.accept());
  return page;
}

export async function settle(page, extra = 600) {
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 20000 }).catch(() => {});
  await page.evaluate(async () => {
    await document.fonts.ready;
    const imgs = [...document.images].filter(i => { const r = i.getBoundingClientRect(); return r.bottom > -200 && r.top < innerHeight + 400; });
    await Promise.all(imgs.map(i => (i.complete ? null : new Promise(r => { i.onload = i.onerror = r; setTimeout(r, 10000); }))));
    await Promise.all(imgs.map(i => i.decode?.().catch(() => {})));
  }).catch(() => {});
  await sleep(extra);
}

// ---------------------------------------------------------------- capture
export let last = null; // last app frame (Buffer)
const cam = { z: 1, cx: APP.w / 2, cy: APP.h / 2 };
const cdpSessions = new WeakMap();
function camRect() {
  const w = APP.w / cam.z, h = APP.h / cam.z;
  return { x: Math.min(Math.max(cam.cx - w / 2, 0), APP.w - w), y: Math.min(Math.max(cam.cy - h / 2, 0), APP.h - h), w, h };
}
async function captureApp(page) {
  let cdp = cdpSessions.get(page);
  if (!cdp) { cdp = await page.createCDPSession(); cdpSessions.set(page, cdp); }
  const r = cam.z <= 1.001 ? { x: 0, y: 0, w: APP.w, h: APP.h } : camRect();
  const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  const scale = APPW / r.w; // zoomed regions are re-rendered at full resolution, not upscaled
  const res = await cdp.send('Page.captureScreenshot', {
    format: 'jpeg', quality: PREVIEW ? 80 : 97, optimizeForSpeed: true,
    clip: { x: scroll.x + r.x, y: scroll.y + r.y, width: r.w, height: APPH / scale, scale },
  });
  last = Buffer.from(res.data, 'base64');
  pendingImg = res.data;
  return last;
}
export async function shot(page) { await captureApp(page); await stageFrame(); }
export async function hold(page, seconds) {
  if (page) await captureApp(page);
  const n = nf(sec(seconds));
  for (let i = 0; i < n; i++) await stageFrame();
}
const raf = page => page.evaluate(() => new Promise(r => { requestAnimationFrame(() => requestAnimationFrame(r)); setTimeout(r, 120); }));

export async function zoomTo(page, target, z, seconds = 0.8) {
  let p = target ?? { x: APP.w / 2, y: APP.h / 2 };
  if (target && target.evaluate) {
    const r = await target.evaluate(e => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, h: b.height }; });
    p = { x: r.l + r.w / 2, y: r.t + r.h / 2 };
    const shotW = APP.w / z;
    if (r.w > shotW * 0.92) p.x = r.l - 10 + shotW / 2;
  }
  const from = { ...cam };
  const n = Math.max(2, nf(sec(seconds)));
  for (let i = 1; i <= n; i++) {
    const t = ease(i / n);
    cam.z = from.z + (z - from.z) * t; cam.cx = from.cx + (p.x - from.cx) * t; cam.cy = from.cy + (p.y - from.cy) * t;
    await shot(page);
  }
}
export const zoomOut = (page, seconds = 0.7) => zoomTo(page, null, 1, seconds);
export async function midpoint(a, b) {
  const c = e => e.evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const [ra, rb] = [await c(a), await c(b)];
  return { x: (ra.x + rb.x) / 2, y: (ra.y + rb.y) / 2 };
}

export async function scrollTo(page, targetY, seconds = 1.2) {
  const startY = await page.evaluate(() => scrollY);
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const endY = Math.max(0, Math.min(maxY, targetY));
  if (Math.abs(endY - startY) < 4) return;
  const n = Math.max(2, nf(sec(seconds)));
  for (let i = 1; i <= n; i++) {
    await page.evaluate(y => window.scrollTo(0, y), startY + (endY - startY) * ease(i / n));
    await raf(page);
    await shot(page);
  }
}

export async function find(page, selector, text, { exact = false, deepest = false } = {}) {
  const h = await page.evaluateHandle((sel, txt, ex, deep) => {
    const els = [...document.querySelectorAll(sel)].filter(e => {
      if (e.closest('header')) return false;
      const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false;
      if (!txt) return true;
      const t = e.textContent.trim();
      return ex ? t === txt : t.includes(txt);
    });
    if (deep) return els.find(e => !els.some(o => o !== e && e.contains(o))) ?? null;
    return els[0] ?? null;
  }, selector, text ?? null, exact, deepest);
  const el = h.asElement();
  if (!el) throw new Error(`not found: ${selector} ${text ?? ''}`);
  return el;
}
export async function findIn(container, selector, text) {
  const h = await container.evaluateHandle((c, sel, txt) => [...c.querySelectorAll(sel)].find(e => e.textContent.trim().includes(txt)) ?? null, selector, text);
  const el = h.asElement();
  if (!el) throw new Error(`not found in card: ${selector} ${text}`);
  return el;
}

export async function bringIntoView(page, el, at = 0.45, seconds = 0.9) {
  if (cam.z > 1.001) return;
  const { top, height } = await el.evaluate(e => { const r = e.getBoundingClientRect(); return { top: r.top + scrollY, height: r.height }; });
  const cur = await page.evaluate(() => scrollY);
  const rTop = top - cur;
  if (rTop > 70 && rTop + height < APP.h - 40) return;
  await scrollTo(page, top - APP.h * at + height / 2, seconds);
}

// Headline captions live on the stage. Fast mode pops them in with a spring.
export async function caption(page, text) {
  if (st.cap.o > 0.01) await hideCaption(page);
  st.cap.text = text;
  const n = FAST ? 12 : 12;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    st.cap.o = easeOut(Math.min(1, t * 1.6));
    st.cap.s = FAST ? 0.55 + 0.45 * spring(t) : 1;
    await stageFrame();
  }
  st.cap.s = 1;
}
export async function hideCaption() {
  if (st.cap.o <= 0.01) return;
  const n = FAST ? 5 : 8;
  for (let i = 1; i <= n; i++) { st.cap.o = 1 - ease(i / n); if (FAST) st.cap.s = 1 + 0.08 * ease(i / n); await stageFrame(); }
  st.cap.o = 0; st.cap.s = 1;
}

export async function tap(page, el, { click = true } = {}) {
  await bringIntoView(page, el);
  const box = await el.evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const D = 46 / cam.z;
  const N = FAST ? 9 : 12;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    await page.evaluate((b, t, D) => {
      let r = document.getElementById('rec-ripple');
      if (!r) { r = document.createElement('div'); r.id = 'rec-ripple'; document.body.appendChild(r); }
      const s = D * (0.55 + 0.75 * t);
      Object.assign(r.style, { width: s + 'px', height: s + 'px', left: b.x - s / 2 + 'px', top: b.y - s / 2 + 'px', opacity: t < 0.35 ? t / 0.35 : 1 - (t - 0.35) / 0.65 });
    }, box, t, D);
    if (FAST) st.phone.s = 1 - 0.018 * Math.sin(Math.PI * Math.min(1, t * 1.4)); // press-down bounce
    await shot(page);
  }
  st.phone.s = 1;
  await page.evaluate(() => { const r = document.getElementById('rec-ripple'); if (r) r.style.opacity = 0; });
  if (click) await el.evaluate(e => e.click());
}

export async function crossfade(page, from, seconds = 0.35) {
  if (!from) return;
  const src = 'data:image/jpeg;base64,' + from.toString('base64');
  await page.evaluate(s => new Promise(res => {
    let f = document.getElementById('rec-fade');
    if (!f) { f = document.createElement('img'); f.id = 'rec-fade'; document.body.appendChild(f); }
    f.style.opacity = 1; f.src = s;
    (f.decode ? f.decode() : Promise.resolve()).then(res, res); setTimeout(res, 1500);
  }), src);
  const n = Math.max(2, nf(sec(seconds)));
  for (let i = 1; i <= n; i++) {
    await page.evaluate(o => { document.getElementById('rec-fade').style.opacity = o; }, 1 - ease(i / n));
    await shot(page);
  }
  await page.evaluate(() => document.getElementById('rec-fade')?.remove());
}

export async function tapAndGo(page, el, { wait = 900, beforeFade } = {}) {
  await tap(page, el);
  const before = last;
  await settle(page, wait);
  if (beforeFade) await beforeFade();
  flash();
  await crossfade(page, before);
}

export async function typeInto(page, el, text, { clear = true } = {}) {
  await bringIntoView(page, el, 0.4, 0.6);
  await el.evaluate(e => e.focus());
  if (clear) { await el.evaluate(e => { e.select?.(); }); await page.keyboard.press('Backspace'); }
  for (const ch of text) { await page.keyboard.type(ch); await shot(page); if (!FAST) await stageFrame(); }
}

// Phone slides up into place showing the current app screen.
export async function phoneIn(page, seconds = 0.9) {
  await captureApp(page);
  flash();
  const n = nf(sec(seconds));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    st.phone.o = easeOut(Math.min(1, t * 1.5)); st.phone.y = 90 * (1 - easeOut(t));
    st.phone.s = FAST ? 0.9 + 0.1 * spring(t) : 1; st.ui = Math.max(st.ui, easeOut(t));
    await stageFrame();
  }
  st.phone.s = 1; st.phone.y = 0;
}
async function phoneOut(seconds = 0.5) {
  if (st.phone.o < 0.01) return;
  const n = nf(sec(seconds));
  for (let i = 1; i <= n; i++) { const t = ease(i / n); st.phone.o = 1 - t; st.phone.y = -40 * t; st.ui = 1 - t; await stageFrame(); }
  st.phone.o = 0; st.ui = 0;
}

export async function card(title, subtitle, seconds, { fadeIn = true, fadeOut = true } = {}) {
  await hideCaption();
  await phoneOut();
  st.card.title = title; st.card.sub = subtitle;
  flash();
  const nIn = fadeIn ? (FAST ? 14 : 18) : 0, nOut = fadeOut ? (FAST ? 8 : 14) : 0;
  for (let i = 1; i <= nIn; i++) {
    const t = i / nIn;
    st.card.o = easeOut(Math.min(1, t * 1.5));
    st.card.s = FAST ? 1.35 - 0.35 * spring(t) : 0.94 + 0.06 * easeOut(t);   // fast: punch in from big
    await stageFrame();
  }
  st.card.o = 1; st.card.s = 1;
  const nHold = Math.max(1, nf(sec(seconds)) - nIn - nOut);
  for (let i = 0; i < nHold; i++) await stageFrame();
  for (let i = 1; i <= nOut; i++) { st.card.o = 1 - ease(i / nOut); st.card.s = 1 + (FAST ? 0.12 : 0.03) * ease(i / nOut); await stageFrame(); }
  if (fadeOut) { st.card.o = 0; st.card.s = 1; }
}

export async function finish(t0) {
  await browser.close().catch(() => {});
  await stageBrowser.close().catch(() => {});
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`Done: ${frames} frames = ${(frames / FPS).toFixed(1)}s of video, took ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
export const OUTFILE = OUT;
