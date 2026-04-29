import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowDownUp, BarChart3, PieChart, Sprout, Landmark, Compass, Globe,
  Wallet, Settings2, Menu, X, ChevronDown, ExternalLink, Vote, Database,
} from "lucide-react";
import flameLogo from "@/assets/flame-logo.png";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";

const NAV_TABS = [
  { label: "Discover", to: "/dex", icon: Compass, exact: true },
  { label: "Market", to: "/dex/market", icon: Globe },
  { label: "Trade", to: "/dex/trade", icon: ArrowDownUp },
  { label: "Lend", to: "/dex/lend", icon: Landmark },
  { label: "Portfolio", to: "/dex/portfolio", icon: PieChart },
  { label: "Earn", to: "/dex/earn", icon: Sprout },
];

const MORE_ITEMS = [
  { label: "Analytics", to: "/dex/analytics", icon: BarChart3 },
  { label: "History", to: "/dex/history", icon: ArrowDownUp },
  { label: "Governance", to: "/dex/governance", icon: Vote },
  { label: "Oracle Admin", to: "/dex/oracle", icon: Database },
];

const DexNavbar = () => {
  const location = useLocation();
  const { address, shortAddress, balance, isConnecting, connect, disconnect } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 lg:px-6">
        {/* Logo + Network */}
        <div className="flex items-center gap-3">
          <Link to="/dex" className="flex items-center gap-2">
            <motion.img
              src={flameLogo}
              alt="TwinFlame DEX"
              className="h-8 w-8 rounded-full drop-shadow-[0_0_6px_hsl(25,95%,53%)]"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="font-display text-lg font-bold text-gradient-fire hidden sm:inline">TwinFlame</span>
          </Link>
          <div className="hidden items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground sm:flex">
            <span className="h-2 w-2 rounded-full bg-[hsl(142,70%,50%)]" />
            Polygon
          </div>
        </div>

        {/* Center Tabs */}
        <div className="hidden items-center gap-0.5 md:flex">
          {NAV_TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all ${
                isActive(tab.to, tab.exact)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          ))}
          {/* More dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium transition-all ${
                MORE_ITEMS.some((m) => isActive(m.to))
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              More <ChevronDown className="h-3 w-3" />
            </button>
            <AnimatePresence>
              {showMore && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-border bg-card p-1.5 shadow-xl"
                >
                  {MORE_ITEMS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setShowMore(false)}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                        isActive(item.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-lg border border-border/50 bg-muted/30 p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" />
          </button>

          {address ? (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/20"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{balance ? `${balance} POL` : shortAddress}</span>
              <span className="sm:hidden">{shortAddress}</span>
            </button>
          ) : (
            <Button onClick={connect} disabled={isConnecting} size="sm" className="bg-gradient-fire text-primary-foreground hover:opacity-90">
              <Wallet className="mr-1.5 h-3.5 w-3.5" />
              {isConnecting ? "Connecting…" : "Connect Wallet"}
            </Button>
          )}

          <Link
            to="/"
            className="hidden items-center gap-1 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground lg:flex"
          >
            <ExternalLink className="h-3 w-3" />
            Main Site
          </Link>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground md:hidden">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Settings Dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-4 top-16 z-50 w-64 rounded-lg border border-border bg-card p-4 shadow-xl"
          >
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings</h4>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Slippage Tolerance</label>
                <div className="flex gap-1">
                  {[0.1, 0.5, 1.0].map((s) => (
                    <button key={s} className="flex-1 rounded-md border border-border/50 bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                      {s}%
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Gas Mode</label>
                <div className="flex gap-1">
                  {["Standard", "Fast", "Instant"].map((g) => (
                    <button key={g} className="flex-1 rounded-md border border-border/50 bg-muted/30 px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {[...NAV_TABS, ...MORE_ITEMS].map((tab) => (
                <Link
                  key={tab.to}
                  to={tab.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive(tab.to, (tab as any).exact) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              ))}
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="mt-2 flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2.5 text-sm text-muted-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                Back to Main Site
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default DexNavbar;
