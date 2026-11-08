import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatDate } from '@/lib/marketplace';
import { cn } from '@/lib/utils';

function Stars({ value, onChange, size = 'w-4 h-4' }: { value: number; onChange?: (v: number) => void; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={cn(!onChange && 'cursor-default')}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star className={cn(size, n <= value ? 'fill-primary text-primary' : 'text-muted-foreground')} />
        </button>
      ))}
    </div>
  );
}

export function StoreReviews({ storeId }: { storeId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: reviews } = useQuery({
    queryKey: ['store-reviews', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_reviews')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: canReview } = useQuery({
    queryKey: ['can-review', storeId, user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .eq('customer_id', user!.id)
        .eq('status', 'delivered');
      if (error) throw error;
      return (count ?? 0) > 0;
    },
    enabled: !!user,
  });

  const mine = reviews?.find(r => r.user_id === user?.id);

  const submit = useMutation({
    mutationFn: async () => {
      const payload = {
        store_id: storeId,
        user_id: user!.id,
        reviewer_name: user!.user_metadata?.full_name || user!.email?.split('@')[0] || 'Customer',
        rating,
        comment: comment.trim() || null,
      };
      const { error } = mine
        ? await supabase.from('store_reviews').update({ rating, comment: payload.comment }).eq('id', mine.id)
        : await supabase.from('store_reviews').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Thanks for your review!');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['store-reviews', storeId] });
      queryClient.invalidateQueries({ queryKey: ['public-stores'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-bold mb-6">Customer Reviews</h2>

      {user && canReview && (
        <form
          onSubmit={e => {
            e.preventDefault();
            submit.mutate();
          }}
          className="bg-card border border-border rounded-xl p-5 mb-6 space-y-3"
        >
          <p className="font-medium">{mine ? 'Update your review' : 'Rate your experience with this store'}</p>
          <Stars value={rating} onChange={setRating} size="w-6 h-6" />
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={mine?.comment ?? 'What did you like? How was delivery?'}
            maxLength={1000}
          />
          <Button type="submit" variant="gold" disabled={submit.isPending}>
            {mine ? 'Update review' : 'Post review'}
          </Button>
        </form>
      )}

      {!reviews?.length ? (
        <p className="text-muted-foreground">No reviews yet. Customers can review a store after an order is delivered.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{r.reviewer_name || 'Customer'}</span>
                <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
              </div>
              <Stars value={r.rating} />
              {r.comment && <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
