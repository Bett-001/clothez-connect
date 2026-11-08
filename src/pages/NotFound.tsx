import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="font-display text-7xl font-bold text-primary mb-4">404</p>
        <h1 className="text-2xl font-semibold mb-2">This page doesn't exist</h1>
        <p className="text-muted-foreground mb-8">The link may be broken, or the page may have moved.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/"><Button variant="gold">Go home</Button></Link>
          <Link to="/stores"><Button variant="outline">Browse stores</Button></Link>
        </div>
      </div>
    </Layout>
  );
}
