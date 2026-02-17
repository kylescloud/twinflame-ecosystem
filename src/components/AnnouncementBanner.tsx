import { Link } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";

const MESSAGE = "🔥 EQT Pre-Launch Sale is LIVE — Get 30% OFF at $3.50/token before launch price of $5.00 — Own a share of TwinFlame protocol revenues";

const AnnouncementBanner = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] overflow-hidden bg-[hsl(var(--equity))] text-primary-foreground">
      <Link
        to="/eqt-presale"
        className="group flex h-9 items-center"
      >
        <div className="animate-marquee flex shrink-0 items-center gap-12 whitespace-nowrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="flex items-center gap-3 text-sm font-medium">
              <Shield className="h-3.5 w-3.5" />
              {MESSAGE}
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider transition-all group-hover:bg-primary-foreground/30">
                Buy Now <ArrowRight className="h-3 w-3" />
              </span>
            </span>
          ))}
        </div>
        <div className="animate-marquee2 flex shrink-0 items-center gap-12 whitespace-nowrap" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="flex items-center gap-3 text-sm font-medium">
              <Shield className="h-3.5 w-3.5" />
              {MESSAGE}
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider transition-all group-hover:bg-primary-foreground/30">
                Buy Now <ArrowRight className="h-3 w-3" />
              </span>
            </span>
          ))}
        </div>
      </Link>
    </div>
  );
};

export default AnnouncementBanner;
