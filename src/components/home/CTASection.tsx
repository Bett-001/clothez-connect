import { Link } from 'react-router-dom';
import { Store, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  const benefits = [
    'Reach thousands of customers across Kenya',
    'Easy-to-use dashboard for managing products',
    'Multiple payment options (M-Pesa, Card, Till)',
    'Direct messaging with customers',
    'Analytics and sales insights',
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-dark relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary blur-[200px]" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Store className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">For Store Owners</span>
              </div>

              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold">
                Start Selling
                <span className="text-gradient-gold block">Today</span>
              </h2>

              <p className="text-lg text-muted-foreground">
                Join Kenya's fastest-growing fashion marketplace. Register your store and reach thousands of eager customers.
              </p>

              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-secondary-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/auth?mode=store">
                  <Button variant="hero" size="lg">
                    Register Your Store
                    <span className="ml-2">→</span>
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-muted-foreground">
                Registration fee: <span className="text-primary font-semibold">US$20</span> (one-time)
              </p>
            </div>

            {/* Visual */}
            <div className="relative hidden md:block">
              <div className="relative rounded-2xl overflow-hidden shadow-glow">
                <img
                  src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=800&fit=crop"
                  alt="Fashion store"
                  className="w-full aspect-[3/4] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
                
                {/* Stats overlay */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-background/90 backdrop-blur-sm">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">500+</div>
                      <div className="text-xs text-muted-foreground">Active Stores</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">10K+</div>
                      <div className="text-xs text-muted-foreground">Products</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">50K+</div>
                      <div className="text-xs text-muted-foreground">Customers</div>
                    </div>
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
