import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";

export interface TokenDef {
  symbol: string;
  name: string;
  logo: string;
  balance?: string;
  color: string;
}

export const ALL_TOKENS: TokenDef[] = [
  { symbol: "BLAZE", name: "TwinFlame BLAZE", logo: TOKEN_LOGOS.BLAZE, balance: "0.00", color: "text-blaze" },
  { symbol: "EMBER", name: "TwinFlame EMBER", logo: TOKEN_LOGOS.EMBER, balance: "0.00", color: "text-ember" },
  { symbol: "EQT", name: "TwinFlame Equity", logo: TOKEN_LOGOS.EQT, balance: "0.00", color: "text-equity" },
  { symbol: "USDC", name: "USD Coin", logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=035", balance: "0.00", color: "text-foreground" },
  { symbol: "WETH", name: "Wrapped Ether", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=035", balance: "0.00", color: "text-foreground" },
  { symbol: "POL", name: "Polygon", logo: "https://cryptologos.cc/logos/polygon-matic-logo.png?v=035", balance: "0.00", color: "text-foreground" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (token: TokenDef) => void;
  excludeSymbol?: string;
}

const TokenSelectorModal = ({ open, onClose, onSelect, excludeSymbol }: Props) => {
  const [query, setQuery] = useState("");

  const filtered = ALL_TOKENS.filter(
    (t) =>
      t.symbol !== excludeSymbol &&
      (t.symbol.toLowerCase().includes(query.toLowerCase()) ||
        t.name.toLowerCase().includes(query.toLowerCase()))
  );

  const popular = ALL_TOKENS.filter((t) => ["BLAZE", "EMBER", "EQT", "USDC"].includes(t.symbol) && t.symbol !== excludeSymbol);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md rounded-xl border border-border bg-card p-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-foreground">Select a Token</h3>
            <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or symbol"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 border-border/50 bg-muted/20"
              autoFocus
            />
          </div>

          {/* Popular Tokens */}
          <div className="mb-3 flex flex-wrap gap-2">
            {popular.map((t) => (
              <button
                key={t.symbol}
                onClick={() => { onSelect(t); onClose(); }}
                className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/20 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/40"
              >
                <img src={t.logo} alt="" className="h-4 w-4 rounded-full" />
                {t.symbol}
              </button>
            ))}
          </div>

          {/* Token List */}
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {filtered.map((t) => (
              <button
                key={t.symbol}
                onClick={() => { onSelect(t); onClose(); }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <img src={t.logo} alt="" className="h-8 w-8 rounded-full" />
                  <div className="text-left">
                    <p className={`font-medium ${t.color}`}>{t.symbol}</p>
                    <p className="text-xs text-muted-foreground">{t.name}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{t.balance}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No tokens found</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TokenSelectorModal;
