import { HeroSection } from '@/app/(public)/_components/hero-section';
import { QuickSearch } from '@/app/(public)/_components/quick-search';
import { FeaturesShowcase } from '@/app/(public)/_components/features-showcase';
import { StoriesPreview } from '@/app/(public)/_components/stories-preview';
import { SocialLinks } from '@/app/(public)/_components/social-links';
import { RegistrationCTA } from '@/app/(public)/_components/registration-cta';
import { PwaEngagement } from '@/app/(public)/_components/pwa-engagement';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <QuickSearch />
      <FeaturesShowcase />
      <StoriesPreview />
      <SocialLinks />
      <PwaEngagement />
      <RegistrationCTA />
    </>
  );
}
