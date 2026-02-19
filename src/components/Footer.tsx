import { Link } from "react-router-dom";
import flameLogo from "@/assets/flame-logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 py-12">
      <div className="container mx-auto flex flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <img src={flameLogo} alt="TwinFlame" className="h-6 w-6 rounded-full" />
          <span className="font-display text-sm font-bold text-gradient-fire">TwinFlame Finance</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 TwinFlame Finance. All rights reserved.
        </p>
        <div className="flex gap-6">
          <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Discord
          </a>
          <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Twitter
          </a>
          <Link to="/docs" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            Docs
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
