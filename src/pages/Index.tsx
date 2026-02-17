import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import TokensSection from "@/components/TokensSection";
import TokenomicsDiagram from "@/components/TokenomicsDiagram";
import AdvancedCharts from "@/components/AdvancedCharts";
import EcosystemSection from "@/components/EcosystemSection";
import WhySection from "@/components/WhySection";
import RoadmapSection from "@/components/RoadmapSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import EmberParticles from "@/components/EmberParticles";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBanner />
      <EmberParticles />
      <Navbar />
      <HeroSection />
      <TokensSection />
      <TokenomicsDiagram />
      <AdvancedCharts />
      <EcosystemSection />
      <WhySection />
      <RoadmapSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
