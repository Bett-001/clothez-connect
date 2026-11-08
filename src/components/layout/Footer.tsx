import { Link } from 'react-router-dom';
import { Store, Mail, Phone, MapPin, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display text-xl font-bold text-foreground">Clotz</span>
                <span className="font-display text-xl font-bold text-primary"> Hub</span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Kenya's premier marketplace for verified clothing stores. Shop with confidence from the best fashion vendors.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/clotzhub/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { to: '/stores', label: 'Browse Stores' },
                { to: '/products', label: 'All Products' },
                { to: '/products?category=gents', label: "Men's Clothing" },
                { to: '/products?category=ladies', label: "Women's Clothing" },
                { to: '/products?category=kids', label: "Kids' Clothing" },
                { to: '/orders', label: 'My Orders' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">For Sellers</h3>
            <ul className="space-y-3">
              {[
                { to: '/register-store', label: 'Register Your Store' },
                { to: '/my-store', label: 'Seller Dashboard' },
                { to: '/my-store?tab=orders', label: 'Manage Orders' },
                { to: '/my-store?tab=products', label: 'Manage Products' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                Nairobi, Kenya
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-primary" />
                +254 700 000 000
              </li>
              <li className="flex items-center gap-3 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-primary" />
                hello@clotzhub.co.ke
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Clotz Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
