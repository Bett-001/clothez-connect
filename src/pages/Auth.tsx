import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Store, User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const isStoreMode = searchParams.get('mode') === 'store';
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: isLogin ? "Welcome back!" : "Account created!", description: "This is a demo. Connect Lovable Cloud for real authentication." });
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&h=1600&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-charcoal/70" />
        <div className="relative z-10 p-12 flex flex-col justify-between">
          <Link to="/" className="flex items-center gap-2"><div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center"><Store className="w-5 h-5 text-primary-foreground" /></div><span className="font-display text-xl font-bold text-cream">Clotz Hub</span></Link>
          <div><h2 className="font-display text-4xl font-bold text-cream mb-4">{isStoreMode ? 'Grow Your Fashion Business' : 'Discover Amazing Fashion'}</h2><p className="text-cream/70 text-lg">{isStoreMode ? 'Join Kenya\'s fastest-growing fashion marketplace and reach thousands of customers.' : 'Shop from verified clothing stores across Kenya with secure payments.'}</p></div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 lg:hidden"><ArrowLeft className="w-4 h-4" />Back to home</Link>
          <div className="text-center mb-8">
            <div className="lg:hidden flex justify-center mb-4"><div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center"><Store className="w-6 h-6 text-primary-foreground" /></div></div>
            <h1 className="font-display text-3xl font-bold mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p className="text-muted-foreground">{isStoreMode ? 'Access your store dashboard' : isLogin ? 'Sign in to continue shopping' : 'Join the Clotz Hub community'}</p>
          </div>
          <div className="flex gap-2 p-1 bg-secondary rounded-lg mb-8">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${isLogin ? 'bg-card text-foreground shadow' : 'text-muted-foreground'}`}>Sign In</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${!isLogin ? 'bg-card text-foreground shadow' : 'text-muted-foreground'}`}>Sign Up</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && <div><Label htmlFor="name">Full Name</Label><div className="relative mt-1"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="name" placeholder="Your name" className="pl-10" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div></div>}
            <div><Label htmlFor="email">Email</Label><div className="relative mt-1"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div></div>
            <div><Label htmlFor="password">Password</Label><div className="relative mt-1"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
            <Button type="submit" variant="gold" className="w-full" size="lg">{isLogin ? 'Sign In' : 'Create Account'}</Button>
          </form>
          {isStoreMode && !isLogin && <p className="text-xs text-muted-foreground text-center mt-4">By registering, you agree to pay a one-time $20 registration fee after approval.</p>}
        </div>
      </div>
    </div>
  );
}
