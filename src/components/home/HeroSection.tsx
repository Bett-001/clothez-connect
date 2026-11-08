import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-dark">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-primary/50 blur-[150px]" />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Kenya's Verified Fashion Marketplace</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight animate-slide-up">
            All In One
            <span className="text-gradient-gold block">Exclusive Store</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Walk through verified clothing shops for men, women and kids. Pick the store you like, fill your cart and check out with M-Pesa or cash.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/stores">
              <Button variant="hero" size="xl">
                Explore Stores
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/register-store">
              <Button variant="outline" size="xl">
                Register Your Store
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 pt-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-sm">Verified Sellers</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="text-sm">M-Pesa & Cash</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="w-5 h-5 text-primary" />
              <span className="text-sm">Delivery or Pickup</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
