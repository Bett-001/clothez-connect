// Cancels unfinished demo orders (as the demo store owner) so the dashboard is clean before recording.
// Cancelling puts the items back into stock.
import fs from 'fs';
const env = Object.fromEntries(fs.readFileSync(new URL('./accounts.env', import.meta.url), 'utf8').trim().split('\n').map(l => l.split(/=(.*)/s).slice(0, 2)));
const SUPA = 'https://iruvuhzriqqkcjhblakk.supabase.co', KEY = 'sb_publishable_35dcsTJPz-B0S-HShdTD8Q_pm6w-fR0';
const auth = await (await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: env.OWNER_EMAIL, password: env.OWNER_PW }),
})).json();
if (!auth.access_token) { console.error('owner sign-in failed', auth); process.exit(1); }
const r = await fetch(`${SUPA}/rest/v1/orders?status=in.(pending,confirmed,processing,shipped)&select=order_number,status`, {
  method: 'PATCH',
  headers: { apikey: KEY, Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
  body: JSON.stringify({ status: 'cancelled' }),
});
const rows = await r.json();
console.log(r.status, Array.isArray(rows) ? rows.map(o => `${o.order_number} cancelled`) : rows);

// Restock the demo products the advert buys, so recordings never hit "Sold out".
const p = await fetch(`${SUPA}/rest/v1/products?stock=lt.10&select=name,stock`, {
  method: 'PATCH',
  headers: { apikey: KEY, Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
  body: JSON.stringify({ stock: 15 }),
});
const prows = await p.json();
console.log(p.status, Array.isArray(prows) ? prows.map(x => `${x.name} restocked to ${x.stock}`) : prows);
