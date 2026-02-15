import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TokensSection from "@/components/TokensSection";
import EcosystemSection from "@/components/EcosystemSection";
import WhySection from "@/components/WhySection";
import RoadmapSection from "@/components/RoadmapSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <TokensSection />
      <EcosystemSection />
      <WhySection />
      <RoadmapSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
