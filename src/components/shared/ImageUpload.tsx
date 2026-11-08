import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Link2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BUCKET = 'store-media';
const MAX_BYTES = 5 * 1024 * 1024;

async function uploadImage(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
  if (file.size > MAX_BYTES) throw new Error('Images must be 5 MB or smaller');
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '31536000' });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function UrlEntry({ onAdd }: { onAdd: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
        <Link2 className="w-3 h-3" /> Paste an image link instead
      </button>
    );
  }
  const submit = () => {
    try {
      const url = new URL(value.trim());
      if (!/^https?:$/.test(url.protocol)) throw new Error();
      onAdd(url.toString());
      setValue('');
      setOpen(false);
    } catch {
      toast.error('Enter a valid image link starting with https://');
    }
  };
  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="https://..."
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
      />
      <Button type="button" variant="outline" onClick={submit}>Add</Button>
    </div>
  );
}

/** A single image, such as a store logo or banner. */
export function SingleImageUpload({
  value,
  onChange,
  aspect = 'square',
  label,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  aspect?: 'square' | 'banner';
  label: string;
}) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file || !user) return;
    setBusy(true);
    try {
      onChange(await uploadImage(user.id, file));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed border-border bg-muted/40 overflow-hidden flex items-center justify-center',
          aspect === 'square' ? 'w-28 h-28' : 'w-full h-32',
        )}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/90 flex items-center justify-center hover:text-destructive"
              aria-label={`Remove ${label}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-primary p-2 text-center"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            Upload {label.toLowerCase()}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => handleFile(e.target.files?.[0])} />
      {!value && <UrlEntry onAdd={onChange} />}
    </div>
  );
}

/** Several product photos. The first one is used as the main photo. */
export function MultiImageUpload({ value, onChange, max = 6 }: { value: string[]; onChange: (urls: string[]) => void; max?: number }) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const room = max - value.length;
    const picked = Array.from(files).slice(0, room);
    if (!picked.length) return;
    setBusy(true);
    const uploaded: string[] = [];
    for (const file of picked) {
      try {
        uploaded.push(await uploadImage(user.id, file));
      } catch (e) {
        toast.error(`${file.name}: ${(e as Error).message}`);
      }
    }
    onChange([...value, ...uploaded]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const makeMain = (i: number) => onChange([value[i], ...value.filter((_, j) => j !== i)]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div key={url} className={cn('relative w-20 h-24 rounded-lg overflow-hidden border-2', i === 0 ? 'border-primary' : 'border-border')}>
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/90 flex items-center justify-center hover:text-destructive"
              aria-label="Remove photo"
            >
              <X className="w-3 h-3" />
            </button>
            {i === 0 ? (
              <span className="absolute bottom-0 inset-x-0 bg-primary text-primary-foreground text-[10px] text-center">Main</span>
            ) : (
              <button type="button" onClick={() => makeMain(i)} className="absolute bottom-0 inset-x-0 bg-background/90 text-[10px] text-center hover:text-primary">
                Make main
              </button>
            )}
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="w-20 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary hover:border-primary"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            Add
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={e => handleFiles(e.target.files)} />
      {value.length < max && <UrlEntry onAdd={url => onChange([...value, url])} />}
    </div>
  );
}
