import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TokensSection from "@/components/TokensSection";
import TokenomicsDiagram from "@/components/TokenomicsDiagram";
import EcosystemSection from "@/components/EcosystemSection";
import WhySection from "@/components/WhySection";
import RoadmapSection from "@/components/RoadmapSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import EmberParticles from "@/components/EmberParticles";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <EmberParticles />
      <Navbar />
      <HeroSection />
      <TokensSection />
      <TokenomicsDiagram />
      <EcosystemSection />
      <WhySection />
      <RoadmapSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
