import ParallaxBlobs from "@/components/ParallaxBlobs";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import AILabSection from "@/components/AILabSection";
import PortfolioSection from "@/components/PortfolioSection";
import ContactSection from "@/components/ContactSection";
import ChatAssistant from "@/components/ChatAssistant";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="relative">
      <ParallaxBlobs />
      <Navigation />
      <HeroSection />
      <AILabSection />
      <PortfolioSection />
      <ContactSection />
      <ChatAssistant />
      <Footer />
    </div>
  );
};

export default Index;
