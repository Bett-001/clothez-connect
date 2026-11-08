import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategorySection } from '@/components/home/CategorySection';
import { FeaturedStores } from '@/components/home/FeaturedStores';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CTASection } from '@/components/home/CTASection';
import { WelcomePanel } from '@/components/home/WelcomePanel';

const Index = () => {
  return (
    <Layout>
      <WelcomePanel />
      <HeroSection />
      <CategorySection />
      <FeaturedStores />
      <FeaturedProducts />
      <CTASection />
    </Layout>
  );
};

export default Index;
