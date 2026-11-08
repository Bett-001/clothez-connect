import { Link } from 'react-router-dom';
import { Store, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { usePublicStores } from '@/hooks/useMarketplace';

export function CTASection() {
  const { data: stores } = usePublicStores();
  const { data: productCount } = useQuery({
    queryKey: ['product-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const benefits = [
    'Your own storefront with logo, banner, location and opening hours',
    'Add products with photos, sizes, colours and stock levels',
    'Receive orders and track them from new to delivered',
    'Get paid straight to your own M-Pesa till or paybill',
    'Offer delivery, in-store pickup, or both',
  ];

  const stats = [
    { value: stores?.length ?? 0, label: 'Open stores' },
    { value: productCount ?? 0, label: 'Products' },
    { value: 3, label: 'Departments' },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-dark relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary blur-[200px]" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Store className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">For Store Owners</span>
              </div>

              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold">
                Open Your Shop
                <span className="text-gradient-gold block">On Clotz Hub</span>
              </h2>

              <p className="text-lg text-muted-foreground">
                Run your clothing store end to end: products, orders, payments and delivery, all from one dashboard.
              </p>

              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={benefit} className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-secondary-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <Link to="/register-store">
                  <Button variant="hero" size="lg">
                    Register Your Store
                    <span className="ml-2">→</span>
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="relative rounded-2xl overflow-hidden shadow-glow">
                <img
                  src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=800&fit=crop"
                  alt="Clothing store interior"
                  className="w-full aspect-[3/4] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-background/90 backdrop-blur-sm">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {stats.map(s => (
                      <div key={s.label}>
                        <div className="text-2xl font-bold text-primary">{s.value.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
