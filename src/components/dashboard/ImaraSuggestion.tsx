import { ExternalLink, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const IMARA_URL = 'https://imaralogic.co.ke';

/** Suggestion shown to stores that take a lot of orders on WhatsApp. Imara Logic is a separate service. */
export function ImaraSuggestion({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-primary/30 bg-primary/5 p-4 flex gap-3', className)}>
      <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
        <MessageCircle className="w-5 h-5" />
      </div>
      <div className="space-y-1.5 text-sm">
        <p className="font-semibold">Busy on WhatsApp? Try Imara Logic</p>
        <p className="text-muted-foreground">
          One shared WhatsApp inbox for you and your staff, so no customer message gets missed. It also offers in-chat
          M-Pesa checkout and bulk SMS for promotions. There's a free plan to start.
        </p>
        <a
          href={IMARA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          Visit imaralogic.co.ke <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <p className="text-xs text-muted-foreground">Imara Logic is a separate company. Orders placed on Clotz Hub still come to your dashboard here.</p>
      </div>
    </div>
  );
}
