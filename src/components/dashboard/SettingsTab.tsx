import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { StoreRow } from '@/lib/marketplace';
import { StoreProfileFields, storeRowToValues, validateStoreProfile, valuesToStoreColumns } from './StoreProfileForm';

export function SettingsTab({ store }: { store: StoreRow }) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState(() => storeRowToValues(store));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const resubmit = store.status === 'rejected';

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateStoreProfile(values);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Please fix the highlighted fields');
      document.getElementById(`store-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('stores')
      .update({ ...valuesToStoreColumns(values), ...(resubmit ? { status: 'pending' as const } : {}) })
      .eq('id', store.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(resubmit ? 'Store resubmitted for review' : 'Store profile saved');
    queryClient.invalidateQueries({ queryKey: ['my-store'] });
    queryClient.invalidateQueries({ queryKey: ['public-stores'] });
  };

  return (
    <form onSubmit={save} className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-8 max-w-3xl">
      <StoreProfileFields values={values} onChange={setValues} errors={errors} />
      <Button type="submit" variant="gold" size="lg" disabled={saving}>
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : resubmit ? 'Save and resubmit for review' : 'Save changes'}
      </Button>
    </form>
  );
}
