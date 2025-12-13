import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategorySection } from '@/components/home/CategorySection';
import { FeaturedStores } from '@/components/home/FeaturedStores';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CategorySection />
      <FeaturedStores />
      <FeaturedProducts />
      <CTASection />
    </Layout>
  );
};

export default Index;
