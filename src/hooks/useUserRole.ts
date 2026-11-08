import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'store_owner' | 'user';

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();

  const { data: roles = [], isPending } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', user!.id);
      if (error) throw error;
      return (data ?? []).map(r => r.role as AppRole);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Still loading while auth is resolving, or while a signed-in user's roles are being fetched.
  // (Treating that gap as "not admin" used to bounce admins away from /admin.)
  const loading = authLoading || (!!user && isPending);

  return {
    roles,
    isAdmin: roles.includes('admin'),
    isStoreOwner: roles.includes('store_owner'),
    loading,
  };
}
