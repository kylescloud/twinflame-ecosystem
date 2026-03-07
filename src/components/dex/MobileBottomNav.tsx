import { Link, useLocation } from "react-router-dom";
import { ArrowDownUp, PieChart, Sprout, Landmark, Compass, Globe } from "lucide-react";

const TABS = [
  { label: "Discover", to: "/dex", icon: Compass, exact: true },
  { label: "Market", to: "/dex/market", icon: Globe },
  { label: "Trade", to: "/dex/trade", icon: ArrowDownUp },
  { label: "Lend", to: "/dex/lend", icon: Landmark },
  { label: "Portfolio", to: "/dex/portfolio", icon: PieChart },
  { label: "Earn", to: "/dex/earn", icon: Sprout },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden">
      <div className="flex items-center justify-around py-2">
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] font-medium transition-colors ${
              isActive(tab.to, tab.exact) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
