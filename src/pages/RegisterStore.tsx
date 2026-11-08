import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Store, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import {
  emptyStoreProfile,
  StoreProfileFields,
  validateStoreProfile,
  valuesToStoreColumns,
  type StoreProfileValues,
} from '@/components/dashboard/StoreProfileForm';

export default function RegisterStore() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [values, setValues] = useState<StoreProfileValues>(emptyStoreProfile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?mode=store&redirect=/register-store');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.email && !values.email) setValues(v => ({ ...v, email: user.email! }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const { data: existingStore, isLoading } = useQuery({
    queryKey: ['my-first-store', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('stores').select('*').eq('owner_id', user!.id).order('created_at').limit(1);
      if (error) throw error;
      return data[0] ?? null;
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateStoreProfile(values);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error('Please fix the highlighted fields');
      document.getElementById(`store-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    if (!user) return;

    setSaving(true);
    const { error } = await supabase.from('stores').insert({ ...valuesToStoreColumns(values), owner_id: user.id });
    setSaving(false);
    if (error) {
      toast.error(error.message || 'Failed to submit registration');
      return;
    }
    toast.success('Application submitted! We will review it shortly.');
    queryClient.invalidateQueries({ queryKey: ['my-first-store'] });
    queryClient.invalidateQueries({ queryKey: ['my-store'] });
    queryClient.invalidateQueries({ queryKey: ['has-store'] });
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (existingStore) {
    const status = existingStore.status;
    const Icon = status === 'approved' ? CheckCircle : status === 'rejected' ? XCircle : Clock;
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${status === 'approved' ? 'bg-green-500/20' : status === 'rejected' ? 'bg-destructive/20' : 'bg-primary/20'}`}>
              <Icon className={`w-8 h-8 ${status === 'approved' ? 'text-green-500' : status === 'rejected' ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">
              {status === 'approved' ? 'Your store is live!' : status === 'rejected' ? 'Application not approved' : 'Application under review'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {status === 'approved'
                ? `"${existingStore.name}" is open on Clotz Hub. Manage products and orders from your dashboard.`
                : status === 'rejected'
                  ? existingStore.rejection_reason || 'Your store application was not approved.'
                  : `"${existingStore.name}" is being reviewed. You can already set up your store profile in the dashboard.`}
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/my-store"><Button variant="gold">{status === 'rejected' ? 'Update and resubmit' : 'Go to dashboard'}</Button></Link>
              {status === 'approved' && <Link to={`/store/${existingStore.id}`}><Button variant="outline">View store</Button></Link>}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-gold mx-auto mb-6 flex items-center justify-center">
              <Store className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Register Your Store</h1>
            <p className="text-muted-foreground">Tell shoppers who you are, where you are and what you sell</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card p-6 md:p-8 rounded-2xl border border-border space-y-8">
            <StoreProfileFields values={values} onChange={setValues} errors={errors} />
            <p className="text-sm text-muted-foreground bg-secondary/50 p-4 rounded-lg">
              Our team reviews every store before it goes live, usually within 24 to 48 hours.
            </p>
            <Button type="submit" variant="gold" className="w-full" size="lg" disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : 'Submit Application'}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
