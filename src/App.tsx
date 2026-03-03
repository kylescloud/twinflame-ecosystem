import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Whitepaper from "./pages/Whitepaper";
import Buy from "./pages/Buy";
import EQTPresale from "./pages/EQTPresale";
import Staking from "./pages/Staking";
import Portfolio from "./pages/Portfolio";
import Swap from "./pages/Swap";
import Docs from "./pages/Docs";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/whitepaper" element={<Whitepaper />} />
          <Route path="/buy" element={<Buy />} />
          <Route path="/eqt-presale" element={<EQTPresale />} />
          <Route path="/staking" element={<Staking />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
