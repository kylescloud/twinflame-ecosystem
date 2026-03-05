import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

// DEX Pages
import DexLayout from "./components/dex/DexLayout";
import DexHome from "./pages/dex/DexHome";
import DexTrade from "./pages/dex/DexTrade";
import DexMarkets from "./pages/dex/DexMarkets";
import DexPortfolio from "./pages/dex/DexPortfolio";
import DexEarn from "./pages/dex/DexEarn";
import DexAnalytics from "./pages/dex/DexAnalytics";
import DexHistory from "./pages/dex/DexHistory";

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

          {/* DEX Platform */}
          <Route path="/dex" element={<DexLayout />}>
            <Route index element={<DexHome />} />
            <Route path="trade" element={<DexTrade />} />
            <Route path="markets" element={<DexMarkets />} />
            <Route path="portfolio" element={<DexPortfolio />} />
            <Route path="earn" element={<DexEarn />} />
            <Route path="analytics" element={<DexAnalytics />} />
            <Route path="history" element={<DexHistory />} />
          </Route>

          {/* Redirects from old routes */}
          <Route path="/twinflame-swap" element={<Navigate to="/dex/trade" replace />} />
          <Route path="/twinflame-lending" element={<Navigate to="/dex/markets" replace />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
