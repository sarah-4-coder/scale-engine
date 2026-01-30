import { useState } from 'react';
import ParallaxBlobs from '@/components/ParallaxBlobs';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import ManualEraSection from '@/components/ManualEraSection';
import ServicesSection from '@/components/ServicesSection';
import MarqueeSection from '@/components/MarqueeSection';
import CaseEvidenceSection from '@/components/CaseEvidenceSection';
import CTASection from '@/components/CTASection';
import BrandFormOverlay from '@/components/BrandFormOverlay';
import Footer from '@/components/Footer';
import ChatAssistant from '@/components/ChatAssistant';

const Index = () => {
  const [isBrandFormOpen, setIsBrandFormOpen] = useState(false);

  const openBrandForm = () => setIsBrandFormOpen(true);
  const closeBrandForm = () => setIsBrandFormOpen(false);

  return (
    <div className="dot-matrix scanline relative">
      <ParallaxBlobs />
      <Navbar onOpenBrandForm={openBrandForm} />
      <HeroSection onOpenBrandForm={openBrandForm} />
      <ManualEraSection />
      <ServicesSection />
      <MarqueeSection />
      <CaseEvidenceSection />
      <ChatAssistant/>
      <CTASection onOpenBrandForm={openBrandForm} />
      <BrandFormOverlay isOpen={isBrandFormOpen} onClose={closeBrandForm} />
      <Footer />
    </div>
  );
};

export default Index;
