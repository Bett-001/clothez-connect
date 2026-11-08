import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { SingleImageUpload } from '@/components/shared/ImageUpload';
import { ImaraSuggestion } from './ImaraSuggestion';
import { CATEGORIES, type StoreRow } from '@/lib/marketplace';
import { cn } from '@/lib/utils';

const phone = z.string().trim().regex(/^\+?[\d\s-]{9,15}$/, 'Enter a valid phone number');
const optional = (schema: z.ZodString) => schema.optional().or(z.literal(''));

export const storeProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Store name must be at least 2 characters').max(80),
    tagline: z.string().trim().max(120, 'Keep the short description under 120 characters'),
    description: z.string().trim().min(20, 'Tell shoppers a bit more (at least 20 characters)').max(1500),
    categories: z.array(z.enum(['gents', 'ladies', 'kids'])).min(1, 'Choose at least one department'),
    location: z.string().trim().min(2, 'Enter the area, for example Westlands'),
    city: z.string().trim().min(2, 'Enter the town or city'),
    address: z.string().trim().max(200),
    map_url: optional(z.string().trim().url('Enter a full map link starting with https://')),
    opening_hours: z.string().trim().max(300),
    phone,
    email: z.string().trim().email('Enter a valid email'),
    whatsapp: optional(phone),
    instagram: z.string().trim().max(60),
    logo_url: z.string().nullable(),
    banner_url: z.string().nullable(),
    offers_delivery: z.boolean(),
    offers_pickup: z.boolean(),
    delivery_fee: z.number().min(0, 'Delivery fee cannot be negative'),
    free_delivery_threshold: z.number().min(0).nullable(),
    mpesa_till: optional(z.string().trim().regex(/^\d{5,8}$/, 'Till numbers are 5 to 8 digits')),
    mpesa_paybill: optional(z.string().trim().regex(/^\d{5,7}$/, 'Paybill numbers are 5 to 7 digits')),
    mpesa_account: z.string().trim().max(30),
    accepts_cash: z.boolean(),
    sells_on_whatsapp: z.boolean(),
    wants_mpesa_prompt: z.boolean(),
  })
  .refine(v => v.offers_delivery || v.offers_pickup, {
    message: 'Offer at least delivery or pickup',
    path: ['offers_delivery'],
  })
  .refine(v => v.accepts_cash || !!v.mpesa_till || !!v.mpesa_paybill, {
    message: 'Add an M-Pesa till or paybill, or accept cash',
    path: ['accepts_cash'],
  });

export type StoreProfileValues = z.infer<typeof storeProfileSchema>;

export const emptyStoreProfile: StoreProfileValues = {
  name: '',
  tagline: '',
  description: '',
  categories: [],
  location: '',
  city: '',
  address: '',
  map_url: '',
  opening_hours: 'Mon–Sat: 9:00am – 7:00pm\nSun: 11:00am – 5:00pm',
  phone: '',
  email: '',
  whatsapp: '',
  instagram: '',
  logo_url: null,
  banner_url: null,
  offers_delivery: true,
  offers_pickup: true,
  delivery_fee: 300,
  free_delivery_threshold: null,
  mpesa_till: '',
  mpesa_paybill: '',
  mpesa_account: '',
  accepts_cash: true,
  sells_on_whatsapp: false,
  wants_mpesa_prompt: false,
};

export function storeRowToValues(s: StoreRow): StoreProfileValues {
  return {
    name: s.name,
    tagline: s.tagline ?? '',
    description: s.description ?? '',
    categories: (s.categories ?? []) as StoreProfileValues['categories'],
    location: s.location ?? '',
    city: s.city ?? '',
    address: s.address ?? '',
    map_url: s.map_url ?? '',
    opening_hours: s.opening_hours ?? '',
    phone: s.phone ?? '',
    email: s.email ?? '',
    whatsapp: s.whatsapp ?? '',
    instagram: s.instagram ?? '',
    logo_url: s.logo_url,
    banner_url: s.banner_url,
    offers_delivery: s.offers_delivery,
    offers_pickup: s.offers_pickup,
    delivery_fee: Number(s.delivery_fee),
    free_delivery_threshold: s.free_delivery_threshold == null ? null : Number(s.free_delivery_threshold),
    mpesa_till: s.mpesa_till ?? '',
    mpesa_paybill: s.mpesa_paybill ?? '',
    mpesa_account: s.mpesa_account ?? '',
    accepts_cash: s.accepts_cash,
    sells_on_whatsapp: s.sells_on_whatsapp ?? false,
    wants_mpesa_prompt: s.wants_mpesa_prompt ?? false,
  };
}

/** Converts form values into columns for the stores table. */
export function valuesToStoreColumns(v: StoreProfileValues) {
  const blank = (x: string | undefined) => (x && x.trim() ? x.trim() : null);
  return {
    name: v.name.trim(),
    tagline: blank(v.tagline),
    description: v.description.trim(),
    categories: v.categories,
    location: v.location.trim(),
    city: v.city.trim(),
    address: blank(v.address),
    map_url: blank(v.map_url),
    opening_hours: blank(v.opening_hours),
    phone: v.phone.trim(),
    email: v.email.trim(),
    whatsapp: blank(v.whatsapp),
    instagram: blank(v.instagram?.replace(/^@/, '')),
    logo_url: v.logo_url,
    banner_url: v.banner_url,
    offers_delivery: v.offers_delivery,
    offers_pickup: v.offers_pickup,
    delivery_fee: v.offers_delivery ? v.delivery_fee : 0,
    free_delivery_threshold: v.offers_delivery ? v.free_delivery_threshold : null,
    mpesa_till: blank(v.mpesa_till),
    mpesa_paybill: blank(v.mpesa_paybill),
    mpesa_account: blank(v.mpesa_account),
    accepts_cash: v.accepts_cash,
    sells_on_whatsapp: v.sells_on_whatsapp,
    wants_mpesa_prompt: v.wants_mpesa_prompt,
  };
}

export function validateStoreProfile(values: StoreProfileValues) {
  const result = storeProfileSchema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.errors) {
    const key = issue.path[0]?.toString();
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 border-t border-border pt-6 first:border-0 first:pt-0">
      <div>
        <legend className="font-semibold text-lg">{title}</legend>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </fieldset>
  );
}

export function StoreProfileFields({
  values,
  onChange,
  errors,
}: {
  values: StoreProfileValues;
  onChange: (v: StoreProfileValues) => void;
  errors: Record<string, string>;
}) {
  const set = <K extends keyof StoreProfileValues>(key: K, value: StoreProfileValues[K]) => onChange({ ...values, [key]: value });

  const text = (key: keyof StoreProfileValues, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div>
      <Label htmlFor={`store-${key}`}>{label}</Label>
      <Input
        id={`store-${key}`}
        value={(values[key] as string) ?? ''}
        onChange={e => set(key, e.target.value as never)}
        className={cn('mt-1', errors[key] && 'border-destructive')}
        {...props}
      />
      {errors[key] && <p className="text-destructive text-sm mt-1">{errors[key]}</p>}
    </div>
  );

  const toggleCategory = (id: StoreProfileValues['categories'][number]) =>
    set('categories', values.categories.includes(id) ? values.categories.filter(c => c !== id) : [...values.categories, id]);

  return (
    <div className="space-y-8">
      <Section title="About your store">
        {text('name', 'Store name', { placeholder: 'e.g. Nairobi Elegance' })}
        {text('tagline', 'Short description', { placeholder: 'e.g. Modern African fashion for men and women', maxLength: 120 })}
        <div>
          <Label htmlFor="store-description">Full description</Label>
          <Textarea
            id="store-description"
            value={values.description}
            onChange={e => set('description', e.target.value)}
            placeholder="What do you sell? What makes your shop special?"
            className={cn('mt-1 min-h-[110px]', errors.description && 'border-destructive')}
            maxLength={1500}
          />
          {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
        </div>
        <div>
          <Label>What do you sell?</Label>
          <div className="flex flex-wrap gap-3 mt-2">
            {CATEGORIES.map(c => (
              <label
                key={c.id}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors',
                  values.categories.includes(c.id) ? 'border-primary bg-primary/5' : 'border-border',
                )}
              >
                <Checkbox checked={values.categories.includes(c.id)} onCheckedChange={() => toggleCategory(c.id)} />
                <span>{c.icon} {c.name}'s clothing</span>
              </label>
            ))}
          </div>
          {errors.categories && <p className="text-destructive text-sm mt-1">{errors.categories}</p>}
        </div>
      </Section>

      <Section title="Logo and banner" hint="Clear photos help shoppers recognise your shop.">
        <div className="flex flex-col sm:flex-row gap-6">
          <div>
            <Label className="block mb-2">Logo</Label>
            <SingleImageUpload value={values.logo_url} onChange={v => set('logo_url', v)} label="Logo" />
          </div>
          <div className="flex-1">
            <Label className="block mb-2">Banner</Label>
            <SingleImageUpload value={values.banner_url} onChange={v => set('banner_url', v)} label="Banner" aspect="banner" />
          </div>
        </div>
      </Section>

      <Section title="Location and hours">
        <div className="grid sm:grid-cols-2 gap-4">
          {text('location', 'Area / estate', { placeholder: 'e.g. Westlands' })}
          {text('city', 'Town / city', { placeholder: 'e.g. Nairobi' })}
        </div>
        {text('address', 'Street address or building (optional)', { placeholder: 'e.g. Sarit Centre, 2nd floor, shop 12' })}
        {text('map_url', 'Google Maps link (optional)', { placeholder: 'https://maps.app.goo.gl/...' })}
        <div>
          <Label htmlFor="store-hours">Opening hours</Label>
          <Textarea id="store-hours" value={values.opening_hours} onChange={e => set('opening_hours', e.target.value)} className="mt-1" rows={3} />
        </div>
      </Section>

      <Section title="Contact" hint="Your phone and email are only shown to Clotz Hub admins. WhatsApp is shown to shoppers.">
        <div className="grid sm:grid-cols-2 gap-4">
          {text('phone', 'Business phone', { placeholder: '0712 345 678', inputMode: 'tel' })}
          {text('email', 'Business email', { type: 'email', placeholder: 'shop@example.com' })}
          {text('whatsapp', 'WhatsApp for customers (optional)', { placeholder: '0712 345 678', inputMode: 'tel' })}
          {text('instagram', 'Instagram handle (optional)', { placeholder: '@yourshop' })}
        </div>
      </Section>

      <Section title="Delivery and pickup">
        <div className="flex flex-col sm:flex-row gap-6">
          <label className="flex items-center gap-3">
            <Switch checked={values.offers_delivery} onCheckedChange={v => set('offers_delivery', v)} />
            I deliver orders
          </label>
          <label className="flex items-center gap-3">
            <Switch checked={values.offers_pickup} onCheckedChange={v => set('offers_pickup', v)} />
            Customers can pick up from my shop
          </label>
        </div>
        {errors.offers_delivery && <p className="text-destructive text-sm">{errors.offers_delivery}</p>}
        {values.offers_delivery && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="store-fee">Delivery fee (KSh)</Label>
              <Input id="store-fee" type="number" min={0} value={values.delivery_fee} onChange={e => set('delivery_fee', Number(e.target.value) || 0)} className="mt-1" />
              {errors.delivery_fee && <p className="text-destructive text-sm mt-1">{errors.delivery_fee}</p>}
            </div>
            <div>
              <Label htmlFor="store-free">Free delivery on orders over (KSh, optional)</Label>
              <Input
                id="store-free"
                type="number"
                min={0}
                value={values.free_delivery_threshold ?? ''}
                onChange={e => set('free_delivery_threshold', e.target.value === '' ? null : Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </Section>

      <Section title="How customers pay you" hint="M-Pesa payments go straight to your own till or paybill.">
        <div className="grid sm:grid-cols-3 gap-4">
          {text('mpesa_till', 'M-Pesa till number', { placeholder: 'e.g. 123456', inputMode: 'numeric' })}
          {text('mpesa_paybill', 'Or paybill number', { placeholder: 'e.g. 522522', inputMode: 'numeric' })}
          {text('mpesa_account', 'Paybill account (optional)', { placeholder: 'Defaults to the order number' })}
        </div>
        <label className="flex items-center gap-3">
          <Switch checked={values.accepts_cash} onCheckedChange={v => set('accepts_cash', v)} />
          Accept cash on delivery or pickup
        </label>
        {errors.accepts_cash && <p className="text-destructive text-sm">{errors.accepts_cash}</p>}
      </Section>

      <Section title="Two quick questions" hint="Your answers help us suggest tools and decide what to build next. Only you and Clotz Hub admins see them.">
        <label className="flex items-start gap-3">
          <Switch className="mt-0.5" checked={values.sells_on_whatsapp} onCheckedChange={v => set('sells_on_whatsapp', v)} />
          <span>
            <span className="font-medium block">Do you get a lot of orders or questions on WhatsApp?</span>
            <span className="text-sm text-muted-foreground">Turn this on and we'll suggest a tool that makes WhatsApp selling easier.</span>
          </span>
        </label>
        {values.sells_on_whatsapp && <ImaraSuggestion />}
        <label className="flex items-start gap-3">
          <Switch className="mt-0.5" checked={values.wants_mpesa_prompt} onCheckedChange={v => set('wants_mpesa_prompt', v)} />
          <span>
            <span className="font-medium block">Would you like shoppers to pay with an M-Pesa prompt on their phone?</span>
            <span className="text-sm text-muted-foreground">
              Shoppers would tap Pay and confirm with their M-Pesa PIN, with no codes to type. It's not available yet. Say yes and we'll let you know when it is.
            </span>
          </span>
        </label>
      </Section>
    </div>
  );
}
