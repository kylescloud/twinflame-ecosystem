import { Flame } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50 py-12">
      <div className="container mx-auto flex flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <span className="font-display text-sm font-bold text-gradient-fire">TwinFlame Finance</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2025 TwinFlame Finance. All rights reserved.
        </p>
        <div className="flex gap-6">
          {["Discord", "Twitter", "Docs"].map((link) => (
            <a key={link} href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
