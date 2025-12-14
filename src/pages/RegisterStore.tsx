import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, Mail, FileText, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { z } from 'zod';

const storeSchema = z.object({
  name: z.string().trim().min(2, 'Store name must be at least 2 characters').max(100),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(500),
  location: z.string().trim().min(2, 'Location is required'),
  phone: z.string().trim().min(10, 'Enter a valid phone number'),
  email: z.string().trim().email('Enter a valid email'),
});

type StoreFormData = z.infer<typeof storeSchema>;

export default function RegisterStore() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingStore, setExistingStore] = useState<any>(null);
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    description: '',
    location: '',
    phone: '',
    email: '',
  });
  const [errors, setErrors] = useState<Partial<StoreFormData>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?mode=store');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkExistingStore();
    }
  }, [user]);

  const checkExistingStore = async () => {
    const { data } = await supabase
      .from('stores')
      .select('*')
      .eq('owner_id', user?.id)
      .maybeSingle();
    
    if (data) {
      setExistingStore(data);
    }
  };

  const validateForm = () => {
    try {
      storeSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<StoreFormData> = {};
        err.errors.forEach((error) => {
          const field = error.path[0] as keyof StoreFormData;
          fieldErrors[field] = error.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;
    
    setLoading(true);

    try {
      const { error } = await supabase.from('stores').insert({
        owner_id: user.id,
        name: formData.name,
        description: formData.description,
        location: formData.location,
        phone: formData.phone,
        email: formData.email,
        status: 'pending',
      });

      if (error) {
        throw error;
      }

      setSubmitted(true);
      toast({
        title: 'Application Submitted!',
        description: 'Your store registration is pending admin approval.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit registration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (existingStore) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${
              existingStore.status === 'approved' 
                ? 'bg-green-500/20' 
                : existingStore.status === 'rejected'
                  ? 'bg-destructive/20'
                  : 'bg-primary/20'
            }`}>
              <Store className={`w-8 h-8 ${
                existingStore.status === 'approved' 
                  ? 'text-green-500' 
                  : existingStore.status === 'rejected'
                    ? 'text-destructive'
                    : 'text-primary'
              }`} />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">
              {existingStore.status === 'approved' 
                ? 'Store Approved!' 
                : existingStore.status === 'rejected'
                  ? 'Store Rejected'
                  : 'Application Pending'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {existingStore.status === 'approved' 
                ? `Your store "${existingStore.name}" is now live on Clotz Hub.`
                : existingStore.status === 'rejected'
                  ? existingStore.rejection_reason || 'Your store application was not approved.'
                  : `Your store "${existingStore.name}" is under review. We'll notify you once it's approved.`}
            </p>
            {existingStore.status === 'approved' && (
              <Button variant="gold" onClick={() => navigate(`/store/${existingStore.id}`)}>
                View My Store
              </Button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-4">Application Submitted!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for registering your store. Our team will review your application and get back to you within 24-48 hours.
            </p>
            <Button variant="gold" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-gold mx-auto mb-6 flex items-center justify-center">
              <Store className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Register Your Store</h1>
            <p className="text-muted-foreground">
              Join Clotz Hub and start selling to thousands of customers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl border border-border">
            <div>
              <Label htmlFor="name">Store Name</Label>
              <div className="relative mt-1">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Your store name"
                  className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <div className="mt-1">
                <Textarea
                  id="description"
                  placeholder="Tell customers about your store and what you sell..."
                  className={`min-h-[100px] ${errors.description ? 'border-destructive' : ''}`}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="City, Country"
                    className={`pl-10 ${errors.location ? 'border-destructive' : ''}`}
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                {errors.location && <p className="text-destructive text-sm mt-1">{errors.location}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+254 700 000 000"
                    className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Business Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="store@example.com"
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="bg-secondary/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <FileText className="w-4 h-4 inline mr-2" />
                By submitting, you agree to our store registration terms. A one-time $20 registration fee applies after approval.
              </p>
            </div>

            <Button type="submit" variant="gold" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
