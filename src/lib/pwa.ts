// "Install app" support: captures the browser's install prompt and registers the service worker.
import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallMode =
  | 'prompt'    // Chrome / Edge / Android: one-tap install
  | 'ios'       // iPhone / iPad Safari: Share -> Add to Home Screen
  | 'in-app'    // inside TikTok / Instagram / Facebook etc.: must open in a real browser first
  | 'installed'
  | 'none';

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
let snapshot: InstallMode = 'none';
const listeners = new Set<() => void>();

const ua = () => navigator.userAgent || '';
const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIOS = () => /iPhone|iPad|iPod/i.test(ua()) || (/Macintosh/.test(ua()) && navigator.maxTouchPoints > 1);
const isInApp = () => /FBAN|FBAV|FB_IAB|Instagram|TikTok|musical_ly|Bytedance|Snapchat|Line\/|Twitter/i.test(ua());

function compute(): InstallMode {
  if (installed || isStandalone()) return 'installed';
  if (deferred) return 'prompt';
  if (isInApp()) return 'in-app';
  if (isIOS()) return 'ios';
  return 'none';
}
function emit() {
  snapshot = compute();
  listeners.forEach(l => l());
}

let started = false;
/** Call once, as early as possible: the install prompt can fire before React mounts. */
export function initPWA() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); // we show our own Install button instead of the browser's mini-bar
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    emit();
  });
  emit();
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => console.warn('Service worker registration failed', err));
    });
  }
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  const event = deferred;
  await event.prompt();
  const { outcome } = await event.userChoice;
  deferred = null;
  if (outcome === 'accepted') installed = true;
  emit();
  return outcome;
}

export function useInstallMode(): InstallMode {
  return useSyncExternalStore(
    l => { listeners.add(l); return () => listeners.delete(l); },
    () => snapshot,
    () => 'none',
  );
}
