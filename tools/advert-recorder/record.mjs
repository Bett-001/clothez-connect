// Records the Clotz Hub advert.
//   node record.mjs vertical   out/tiktok.mp4   --fast        punchy TikTok / Reels cut (4K vertical)
//   node record.mjs landscape  out/wide.mp4                   calmer premium cut (4K widescreen)
// Add --preview for a quick low-res test, --no-order to stop before placing an order.
import {
  PREVIEW, NO_ORDER, FAST, VERTICAL, BASE, env, W, H, OUTFILE, sleep, log, signIn, newPage, settle, last, hold, zoomTo, zoomOut,
  midpoint, scrollTo, find, findIn, bringIntoView, caption as rawCaption, hideCaption, tap, tapAndGo, typeInto, phoneIn, card, finish, crossfade, flash,
} from './lib.mjs';

// TikTok cut uses short, punchy captions.
const VIRAL = {
  'Shop stores across Kenya': 'Kenya’s clothing shops. ONE app 🔥',
  'Verified shops for men, women & kids': 'Men 👔 Women 👗 Kids 🧸',
  'Browse by category': 'Find your style fast',
  'Real photos, sizes & stock': 'Real photos. Real stock.',
  'Added to cart': 'Tap. Added. 🛍️',
  'Check out in seconds': 'Checkout in seconds ⚡',
  'Delivery or pickup': 'Delivery or pickup 🚚',
  'Pay with M-Pesa or cash': 'Pay with M-Pesa 💚',
  'Order placed!': 'Order placed! ✅',
  'Pay the store, enter your code': 'Straight to the shop’s till 💸',
  'Your own store dashboard': 'Shop owners get it instantly',
  'Check the M-Pesa code, mark paid': 'Payment confirmed 💰',
  'Delivered. Customer happy.': 'Delivered 🎉',
  'Track every order': 'Track it to your door 📦',
};
const caption = (page, text) => rawCaption(page, FAST ? VIRAL[text] ?? text : text);

const t0 = Date.now();
try {
  console.log(`Recording ${VERTICAL ? 'vertical' : 'widescreen'}${FAST ? ' FAST' : ''} ${W}x${H}${PREVIEW ? ' (preview)' : ''} -> ${OUTFILE}`);
  const shopperSession = await signIn(env.SHOPPER_EMAIL, env.SHOPPER_PW);
  const ownerSession = await signIn(env.OWNER_EMAIL, env.OWNER_PW);

  if (FAST) await card('All your fave\nclothing shops 🛍️', 'in ONE app 🇰🇪', 2.2);
  else await card('Clotz Hub', VERTICAL ? 'Your favourite clothing stores.\nOne app.' : 'Your favourite clothing stores. One app.', 2.8);

  // 1. Home
  const shop = await newPage(shopperSession);
  await shop.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await settle(shop, 1800);
  await phoneIn(shop);
  await caption(shop, 'Shop stores across Kenya');
  await hold(shop, 1.4);
  log('home');
  const heroTop = await shop.evaluate(() => (document.querySelector('main section:nth-of-type(2)')?.getBoundingClientRect().top ?? 400) + scrollY);
  await scrollTo(shop, heroTop - 64, 1.4);
  await hold(shop, 0.8);
  await hideCaption(shop);
  const storesSection = await find(shop, 'main h2', 'Store');
  await bringIntoView(shop, storesSection, 0.2, 1.5);
  await settle(shop, 300);
  await caption(shop, 'Verified shops for men, women & kids');
  await hold(shop, 1.6);
  await hideCaption(shop);

  // 2. Women's category
  const women = await find(shop, 'main a[href="/products?category=ladies"]');
  await tapAndGo(shop, women);
  await caption(shop, 'Browse by category');
  await hold(shop, 1.3);
  log('category');

  // 3. Product
  const dress = await find(shop, 'main a[href^="/product/"]', 'Silk Maxi Dress');
  await hideCaption(shop);
  await tapAndGo(shop, dress, { wait: 1400 });
  await caption(shop, 'Real photos, sizes & stock');
  await hold(shop, 1.6);
  await hideCaption(shop);
  log('product');
  const sizeM = await find(shop, 'main button', 'M', { exact: true });
  const colourPeek = await shop.evaluateHandle(() => [...document.querySelectorAll('main button')].find(b => b.textContent.trim() === 'Emerald') ?? null);
  await bringIntoView(shop, sizeM, 0.45, 0.8);
  await zoomTo(shop, colourPeek.asElement() ? await midpoint(sizeM, colourPeek.asElement()) : sizeM, 1.9, 0.9);
  await tap(shop, sizeM);
  await sleep(150);
  await hold(shop, 0.3);
  const colour = await shop.evaluateHandle(() => [...document.querySelectorAll('main button')].find(b => b.textContent.trim() === 'Emerald') ?? null);
  if (colour.asElement()) { await tap(shop, colour.asElement()); await sleep(150); }
  await hold(shop, 0.4);
  const add = await find(shop, 'main button', 'Add to Cart');
  await zoomOut(shop, 0.6);
  await bringIntoView(shop, add, 0.5, 0.6);
  await zoomTo(shop, add, 1.5, 0.6);
  await tap(shop, add);
  await sleep(700);
  await caption(shop, 'Added to cart');
  await hold(shop, 1.0);
  await zoomOut(shop, 0.6);
  await hideCaption(shop);

  // 4. Cart
  const cartBtn = await shop.$('header button[aria-label="Cart"]');
  await tap(shop, cartBtn, { click: false });
  await shop.evaluate(() => document.querySelector('header button[aria-label="Cart"]').closest('a').click());
  const beforeCart = last;
  await settle(shop, 800);
  flash();
  await crossfade(shop, beforeCart);
  await caption(shop, 'Check out in seconds');
  await hold(shop, 1.3);
  log('cart');
  const proceed = await find(shop, 'main button', 'Proceed to Checkout');
  await hideCaption(shop);
  await tapAndGo(shop, proceed, {
    wait: 1200,
    // Use a neutral contact email so the demo account's address never appears on camera.
    beforeFade: () => shop.evaluate(() => {
      const el = document.getElementById('email');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(el, 'wanjiku@example.com');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }),
  });
  log('checkout');

  // 5. Checkout form
  await caption(shop, 'Delivery or pickup');
  await hold(shop, 1.0);
  await hideCaption(shop);
  const nameVal = await shop.$eval('#name', e => e.value);
  if (!nameVal) await typeInto(shop, await shop.$('#name'), 'Wanjiku Kamau');
  await typeInto(shop, await shop.$('#phone'), '0712 345 678');
  const addr = await shop.$('#address');
  if (addr) {
    await typeInto(shop, addr, 'Kilimani, Argwings Kodhek Rd');
    await typeInto(shop, await shop.$('#city'), 'Nairobi');
  }
  const mpesa = await find(shop, 'main button', 'M-Pesa');
  await bringIntoView(shop, mpesa, 0.45, 0.8);
  await zoomTo(shop, mpesa, 1.7, 0.8);
  await tap(shop, mpesa);
  await caption(shop, 'Pay with M-Pesa or cash');
  await hold(shop, 1.2);
  await zoomOut(shop, 0.6);
  await hideCaption(shop);
  const place = await find(shop, 'main button', 'Place order');
  await bringIntoView(shop, place, 0.6, 1.0);
  await hold(shop, 0.7);

  if (NO_ORDER) {
    await tap(shop, place, { click: false });
    await hold(shop, 0.8);
    log('stopping before placing order (--no-order)');
  } else {
    await tapAndGo(shop, place, { wait: 1800 });
    await shop.evaluate(() => window.scrollTo(0, 0));
    const thanks = await find(shop, 'main div', 'Thank you', { deepest: true });
    await zoomTo(shop, thanks, 1.55, 0.8);
    await caption(shop, 'Order placed!');
    await hold(shop, 1.4);
    await zoomOut(shop, 0.6);
    log('order placed:', shop.url());
    await hideCaption(shop);
    const codeInput = await find(shop, 'main input[placeholder^="e.g. SJK"]');
    await bringIntoView(shop, codeInput, 0.5, 1.0);
    const payBox = (await codeInput.evaluateHandle(e => e.closest('form')?.parentElement ?? e)).asElement();
    await zoomTo(shop, payBox, 1.6, 0.9);
    await caption(shop, 'Pay the store, enter your code');
    await typeInto(shop, codeInput, 'SKL4H7X2QP', { clear: false });
    const submit = await find(shop, 'main button', 'Submit code');
    await tap(shop, submit);
    await settle(shop, 900);
    await hold(shop, 1.0);
    await zoomOut(shop, 0.6);
    await hideCaption(shop);
    const orderUrl = shop.url();
    const orderNo = await shop.evaluate(() => document.body.innerText.match(/CH-[0-9A-F]{8}/i)?.[0]);
    log('order number', orderNo);

    // 6. Store owner side
    await card(FAST ? 'Meanwhile… 👀' : 'Meanwhile…', 'the shop owner gets the order', 1.8);
    const owner = await newPage(ownerSession);
    await owner.goto(BASE + '/my-store?tab=orders', { waitUntil: 'networkidle2' });
    await settle(owner, 1500);
    await phoneIn(owner);
    await caption(owner, 'Your own store dashboard');
    await hold(owner, 1.6);
    log('owner dashboard');
    await hideCaption(owner);
    const head = await find(owner, 'main button', orderNo);
    const cardEl = (await head.evaluateHandle(e => e.parentElement)).asElement();
    const expanded = await cardEl.evaluate(c => [...c.querySelectorAll('button')].some(b => b.textContent.includes('Confirm order')));
    if (!expanded) { await tap(owner, head); await sleep(500); }
    await hold(owner, 0.6);
    const confirmBtn = await findIn(cardEl, 'button', 'Confirm order');
    await bringIntoView(owner, confirmBtn, 0.55, 1.0);
    await hold(owner, 0.6);
    const paid = await findIn(cardEl, 'button', 'Mark paid');
    await bringIntoView(owner, paid, 0.5, 0.6);
    await zoomTo(owner, paid, 1.8, 0.8);
    await caption(owner, 'Check the M-Pesa code, mark paid');
    await hold(owner, 0.8);
    await tap(owner, paid);
    await settle(owner, 700);
    await hold(owner, 0.8);
    await zoomOut(owner, 0.6);
    for (const label of ['Confirm order', 'Start preparing', 'Mark out for delivery', 'Mark delivered']) {
      const b = await findIn(cardEl, 'button', label);
      await tap(owner, b);
      await settle(owner, 600);
      await hold(owner, 0.35);
    }
    const completedTab = await find(owner, 'main button', 'Completed');
    await tap(owner, completedTab);
    await settle(owner, 600);
    await owner.evaluate(() => window.scrollTo(0, 0));
    const doneHead = await find(owner, 'main button', orderNo);
    await bringIntoView(owner, doneHead, 0.35, 0.8);
    await hideCaption(owner);
    await caption(owner, 'Delivered. Customer happy.');
    await hold(owner, 1.4);
    await owner.close();

    // 7. Shopper sees it
    const before = last;
    await shop.bringToFront();
    await shop.goto(orderUrl, { waitUntil: 'networkidle2' });
    await settle(shop, 1200);
    flash();
    await crossfade(shop, before, 0.4);
    const step = await find(shop, 'main *', 'Out for delivery', { exact: true }).catch(() => null);
    if (step) await zoomTo(shop, step, 1.6, 0.9);
    await caption(shop, 'Track every order');
    await hold(shop, 1.6);
    await zoomOut(shop, 0.6);
    await hideCaption(shop);
  }
  await shop.close();

  if (FAST) await card('Shop now 🛍️\nor open your store', 'clotzhub.vercel.app\n🔗 link in bio', 3.0, { fadeOut: false });
  else await card('Open your store\non Clotz Hub', VERTICAL ? 'Shop or sell today\nclotzhub.vercel.app' : 'Shop or sell today · clotzhub.vercel.app', 3.2, { fadeOut: false });
} catch (e) {
  console.error('RECORDING FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await finish(t0);
}
