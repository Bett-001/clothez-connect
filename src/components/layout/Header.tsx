import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, Search, Store, LogOut, Loader2, Package, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { InstallAppButton } from '@/components/InstallApp';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useUserRole();

  const { data: hasStore } = useQuery({
    queryKey: ['has-store', user?.id],
    queryFn: async () => {
      const { count } = await supabase.from('stores').select('id', { count: 'exact', head: true }).eq('owner_id', user!.id);
      return (count ?? 0) > 0;
    },
    enabled: !!user,
  });

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/stores', label: 'Stores' },
    { href: '/products?category=gents', label: 'Men' },
    { href: '/products?category=ladies', label: 'Women' },
    { href: '/products?category=kids', label: 'Kids' },
  ];

  const isActive = (href: string) => {
    const [path, qs] = href.split('?');
    if (qs) return location.pathname === path && location.search.includes(qs);
    return location.pathname === path && (path !== '/products' || !location.search.includes('category'));
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
    navigate('/');
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
    setSearchOpen(false);
    setIsMenuOpen(false);
    setQuery('');
  };

  const accountLinks = [
    { to: '/orders', label: 'My Orders', icon: Package, show: true },
    { to: hasStore ? '/my-store' : '/register-store', label: hasStore ? 'My Store' : 'Sell on Clotz Hub', icon: Store, show: true },
    { to: '/admin', label: 'Admin', icon: ShieldCheck, show: isAdmin },
  ].filter(l => l.show);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-xl font-bold text-foreground">Clotz</span>
              <span className="font-display text-xl font-bold text-primary"> Hub</span>
            </div>
          </Link>

          {searchOpen ? (
            <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xl gap-2">
              <Input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." />
              <Button type="button" variant="ghost" size="icon" onClick={() => setSearchOpen(false)} aria-label="Close search"><X className="w-5 h-5" /></Button>
            </form>
          ) : (
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn('text-sm font-medium transition-colors hover:text-primary', isActive(link.href) ? 'text-primary' : 'text-muted-foreground')}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {!searchOpen && (
              <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setSearchOpen(true)} aria-label="Search">
                <Search className="w-5 h-5" />
              </Button>
            )}

            <InstallAppButton className="hidden md:flex" />

            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center animate-scale-in">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>

            {user && isAdmin && (
              <Link to="/admin" className="hidden lg:block">
                <Button variant={location.pathname === '/admin' ? 'gold' : 'outline'} size="sm"><ShieldCheck className="w-4 h-4" />Admin</Button>
              </Link>
            )}
            {user && hasStore && (
              <Link to="/my-store" className="hidden lg:block">
                <Button variant={location.pathname === '/my-store' ? 'gold' : 'outline'} size="sm"><Store className="w-4 h-4" />My Store</Button>
              </Link>
            )}

            {loading ? (
              <Button variant="ghost" size="icon" disabled><Loader2 className="w-4 h-4 animate-spin" /></Button>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="gold-outline" size="sm" className="hidden md:flex">
                    <User className="w-4 h-4" />
                    {user.user_metadata?.full_name?.split(' ')[0] || 'Account'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem disabled className="text-muted-foreground text-xs">{user.email}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {accountLinks.map(l => (
                    <DropdownMenuItem key={l.to} asChild>
                      <Link to={l.to}><l.icon className="w-4 h-4 mr-2" />{l.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth" className="hidden md:block">
                <Button variant="gold-outline" size="sm"><User className="w-4 h-4" />Sign In</Button>
              </Link>
            )}

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-background border-t border-border animate-slide-up max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="container mx-auto px-4 py-6 space-y-3">
            <form onSubmit={submitSearch} className="flex gap-2 mb-2">
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." />
              <Button type="submit" variant="gold" size="icon" aria-label="Search"><Search className="w-4 h-4" /></Button>
            </form>
            <InstallAppButton full className="mb-1" onDone={() => setIsMenuOpen(false)} />
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn('block py-2 text-lg font-medium transition-colors', isActive(link.href) ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <div className="border-t border-border pt-3 text-sm text-muted-foreground">Signed in as {user.email}</div>
                {accountLinks.map(l => (
                  <Link key={l.to} to={l.to} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 py-2 text-lg font-medium text-muted-foreground hover:text-foreground">
                    <l.icon className="w-5 h-5" />{l.label}
                  </Link>
                ))}
                <Button variant="destructive" className="w-full mt-4" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <Button variant="gold" className="w-full mt-4"><User className="w-4 h-4" />Sign In / Register</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
