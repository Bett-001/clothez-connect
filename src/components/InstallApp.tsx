import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, MoreVertical, PlusSquare, Share, Store, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { promptInstall, useInstallMode } from '@/lib/pwa';

const DISMISS_KEY = 'clotzhub-install-dismissed';
const DISMISS_DAYS = 14;

function wasDismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return !!at && Date.now() - at < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}
function rememberDismiss() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* storage blocked: banner just shows again */ }
}

const isAndroid = () => /Android/i.test(navigator.userAgent);

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <span className="text-sm">{children}</span>
    </li>
  );
}

/** Instructions for browsers that can't install with one tap (iPhone Safari, in-app browsers). */
function InstallHelp({ open, onOpenChange, mode }: { open: boolean; onOpenChange: (o: boolean) => void; mode: 'ios' | 'in-app' }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center mb-2 mx-auto sm:mx-0">
            <Store className="w-7 h-7 text-primary-foreground" />
          </div>
          <DialogTitle>Install Clotz Hub</DialogTitle>
          <DialogDescription>Add it to your home screen and open it like any other app.</DialogDescription>
        </DialogHeader>
        {mode === 'ios' ? (
          <ol className="space-y-3">
            <Step n={1}>Tap the <Share className="inline w-4 h-4 mx-0.5 -mt-0.5 text-primary" /> <b>Share</b> button at the bottom of Safari.</Step>
            <Step n={2}>Scroll down and tap <PlusSquare className="inline w-4 h-4 mx-0.5 -mt-0.5 text-primary" /> <b>Add to Home Screen</b>.</Step>
            <Step n={3}>Tap <b>Add</b>. Clotz Hub appears on your home screen.</Step>
          </ol>
        ) : (
          <ol className="space-y-3">
            <Step n={1}>
              You're inside another app's browser, which can't install apps. Tap the{' '}
              <MoreVertical className="inline w-4 h-4 -mt-0.5 text-primary" /> or <b>•••</b> menu at the top.
            </Step>
            <Step n={2}>Choose <b>{isAndroid() ? 'Open in Chrome' : 'Open in Safari'}</b> (or "Open in browser").</Step>
            <Step n={3}>Then tap <b>Install app</b> on Clotz Hub.</Step>
          </ol>
        )}
        <Button variant="gold" className="w-full mt-2" onClick={() => onOpenChange(false)}>Got it</Button>
      </DialogContent>
    </Dialog>
  );
}

function useInstallAction() {
  const mode = useInstallMode();
  const [helpOpen, setHelpOpen] = useState(false);
  const install = async () => {
    if (mode === 'prompt') {
      const outcome = await promptInstall();
      if (outcome === 'accepted') toast({ title: 'Clotz Hub installed', description: 'Find it on your home screen or app list.' });
    } else if (mode === 'ios' || mode === 'in-app') {
      setHelpOpen(true);
    }
  };
  const help = mode === 'ios' || mode === 'in-app'
    ? <InstallHelp open={helpOpen} onOpenChange={setHelpOpen} mode={mode} />
    : null;
  return { mode, install, help, available: mode === 'prompt' || mode === 'ios' || mode === 'in-app' };
}

/** "Install app" button for the header and menus. Hidden when installing isn't possible or it's already installed. */
export function InstallAppButton({ className, full = false, onDone }: { className?: string; full?: boolean; onDone?: () => void }) {
  const { install, help, available } = useInstallAction();
  if (!available) return null;
  return (
    <>
      <Button
        variant={full ? 'gold' : 'outline'}
        size={full ? 'default' : 'sm'}
        className={cn(full && 'w-full', className)}
        onClick={async () => { await install(); onDone?.(); }}
      >
        <Download className="w-4 h-4" />Install app
      </Button>
      {help}
    </>
  );
}

const HIDE_BANNER_ON = ['/checkout', '/auth'];

/** Bottom banner on phones inviting people to install. Dismissable; comes back after two weeks. */
export function InstallBanner() {
  const { install, help, available } = useInstallAction();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => { setDismissed(wasDismissedRecently()); }, []);

  const show = available && !dismissed && !HIDE_BANNER_ON.some(p => pathname.startsWith(p));
  return (
    <>
      {show && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-slide-up">
          <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-card/95 backdrop-blur p-3 shadow-2xl">
            <img src="/icon-192.png" alt="" className="w-11 h-11 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Get the Clotz Hub app</p>
              <p className="text-xs text-muted-foreground leading-tight">Faster shopping, right from your home screen</p>
            </div>
            <Button variant="gold" size="sm" onClick={install}>Install</Button>
            <button
              onClick={() => { rememberDismiss(); setDismissed(true); }}
              className="p-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {help}
    </>
  );
}
