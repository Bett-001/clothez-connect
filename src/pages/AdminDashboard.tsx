import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Store, CheckCircle, XCircle, Clock, Loader2, AlertTriangle, Star } from 'lucide-react';
import { categoryName } from '@/lib/marketplace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface StoreApplication {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  location: string | null;
  city: string | null;
  categories: string[];
  whatsapp: string | null;
  is_featured: boolean;
  phone: string | null;
  email: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  owner_id: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  
  const [stores, setStores] = useState<StoreApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/');
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
      }
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStores();
    }
  }, [isAdmin, filter]);

  const fetchStores = async () => {
    setLoading(true);
    
    let query = supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching stores:', error);
      toast({
        title: 'Error',
        description: 'Failed to load store applications',
        variant: 'destructive',
      });
    } else {
      setStores(data || []);
    }
    
    setLoading(false);
  };

  const handleApprove = async (store: StoreApplication) => {
    setActionLoading(true);
    
    const { error } = await supabase
      .from('stores')
      .update({ status: 'approved', rejection_reason: null })
      .eq('id', store.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve store',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Store Approved',
        description: `${store.name} has been approved and is now live.`,
      });
      fetchStores();
    }
    
    setActionLoading(false);
  };

  const toggleFeatured = async (store: StoreApplication) => {
    const { error } = await supabase.from('stores').update({ is_featured: !store.is_featured }).eq('id', store.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: store.is_featured ? 'Removed from featured' : 'Store featured on the homepage' });
      fetchStores();
    }
  };

  const handleReject = async () => {
    if (!selectedStore || !rejectionReason.trim()) return;
    
    setActionLoading(true);
    
    const { error } = await supabase
      .from('stores')
      .update({ 
        status: 'rejected', 
        rejection_reason: rejectionReason.trim() 
      })
      .eq('id', selectedStore.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject store',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Store Rejected',
        description: `${selectedStore.name} has been rejected.`,
      });
      setRejectDialogOpen(false);
      setSelectedStore(null);
      setRejectionReason('');
      fetchStores();
    }
    
    setActionLoading(false);
  };

  if (authLoading || roleLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const statusCounts = {
    pending: stores.filter(s => s.status === 'pending').length,
    approved: stores.filter(s => s.status === 'approved').length,
    rejected: stores.filter(s => s.status === 'rejected').length,
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage store registrations and approvals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card p-6 rounded-xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.pending}</p>
                <p className="text-muted-foreground text-sm">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.approved}</p>
                <p className="text-muted-foreground text-sm">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-xl border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-destructive/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statusCounts.rejected}</p>
                <p className="text-muted-foreground text-sm">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'gold' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Store List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No store applications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-card p-6 rounded-xl border border-border"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-xl font-bold">{store.name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          store.status === 'approved'
                            ? 'bg-green-500/20 text-green-500'
                            : store.status === 'rejected'
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-primary/20 text-primary'
                        }`}
                      >
                        {store.status}
                      </span>
                    </div>
                    {store.tagline && <p className="text-primary text-sm mb-1">{store.tagline}</p>}
                    <p className="text-muted-foreground text-sm mb-2">{store.description}</p>
                    {store.categories?.length > 0 && (
                      <p className="text-sm mb-2">Sells: {store.categories.map(categoryName).join(', ')}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>📍 {[store.location, store.city].filter(Boolean).join(', ') || 'N/A'}</span>
                      {store.whatsapp && <span>💬 {store.whatsapp}</span>}
                      <span>📞 {store.phone || 'N/A'}</span>
                      <span>✉️ {store.email || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Applied: {new Date(store.created_at).toLocaleDateString()}
                    </p>
                    {store.rejection_reason && (
                      <div className="mt-3 p-3 bg-destructive/10 rounded-lg">
                        <p className="text-sm text-destructive flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {store.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  {store.status === 'approved' && (
                    <div className="flex gap-2 flex-wrap">
                      <Link to={`/store/${store.id}`}><Button variant="outline" size="sm">View</Button></Link>
                      <Button variant={store.is_featured ? 'gold' : 'outline'} size="sm" onClick={() => toggleFeatured(store)}>
                        <Star className="w-4 h-4 mr-1" />
                        {store.is_featured ? 'Featured' : 'Feature'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          setSelectedStore(store);
                          setRejectDialogOpen(true);
                        }}
                      >
                        Suspend
                      </Button>
                    </div>
                  )}
                  {store.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStore(store);
                          setRejectDialogOpen(true);
                        }}
                        disabled={actionLoading}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => handleApprove(store)}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedStore?.status === 'approved' ? 'Suspend Store' : 'Reject Store Application'}</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{selectedStore?.name}". This will be visible to the applicant.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reject Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
