import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { RitualsPreview } from '@/components/home/RitualsPreview';
import { ValuesSection } from '@/components/home/ValuesSection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
      <RitualsPreview />
      <ValuesSection />
    </Layout>
  );
};

export default Index;
