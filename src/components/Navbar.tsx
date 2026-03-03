import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, BookOpen, Wallet, ShoppingCart, Layers, PieChart, ArrowDownUp, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import flameLogo from "@/assets/flame-logo.png";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Tokens", href: "/#tokens" },
  { label: "Ecosystem", href: "/#ecosystem" },
  { label: "Roadmap", href: "/#roadmap" },
  { label: "Why TwinFlame", href: "/#why" },
];

const pageLinks = [
  { label: "Buy", to: "/buy", icon: ShoppingCart },
  { label: "Swap", to: "/swap", icon: ArrowDownUp },
  { label: "Staking", to: "/staking", icon: Layers },
  { label: "How It Works", to: "/how-it-works", icon: Compass },
  { label: "Whitepaper", to: "/whitepaper", icon: BookOpen },
  { label: "Portfolio", to: "/portfolio", icon: PieChart },
];

const ConnectWalletButton = ({ className }: { className?: string }) => {
  const { address, shortAddress, isConnecting, connect, disconnect } = useWallet();

  if (address) {
    return (
      <button
        onClick={disconnect}
        className={`flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/20 ${className}`}
      >
        <Wallet className="h-3.5 w-3.5" />
        {shortAddress}
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className={`flex items-center gap-2 rounded-lg bg-gradient-fire px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60 ${className}`}
    >
      <Wallet className="h-3.5 w-3.5" />
      {isConnecting ? "Connecting…" : "Connect Wallet"}
    </button>
  );
};

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-9 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <motion.img
            src={flameLogo}
            alt="TwinFlame"
            className="h-10 w-10 rounded-full drop-shadow-[0_0_8px_hsl(25,95%,53%)]"
            animate={{ scale: [1, 1.08, 1], filter: ["drop-shadow(0 0 6px hsl(25,95%,53%))", "drop-shadow(0 0 14px hsl(25,95%,53%))", "drop-shadow(0 0 6px hsl(25,95%,53%))"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="font-display text-xl font-bold text-gradient-fire">TwinFlame</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          {pageLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          ))}
          <ConnectWalletButton />
        </div>

        <button onClick={() => setOpen(!open)} className="text-foreground md:hidden">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              {pageLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              ))}
              <ConnectWalletButton className="justify-center" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
