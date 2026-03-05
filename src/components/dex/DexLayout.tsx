import { Outlet } from "react-router-dom";
import DexNavbar from "./DexNavbar";
import MobileBottomNav from "./MobileBottomNav";
import EmberParticles from "@/components/EmberParticles";

const DexLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <DexNavbar />
      <div className="pointer-events-none fixed inset-0 z-0">
        <EmberParticles />
      </div>
      <main className="relative z-10 mx-auto max-w-[1440px] px-4 pb-24 pt-20 md:pb-8 lg:px-6">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default DexLayout;
