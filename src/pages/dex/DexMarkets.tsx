import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";
import AssetDetailModal from "@/components/dex/AssetDetailModal";

const MARKETS = [
  { symbol: "BLAZE", logo: TOKEN_LOGOS.BLAZE, totalSupplied: 2450000, totalBorrowed: 1127000, supplyAPY: 4.2, borrowAPY: 8.5, utilization: 46, collateralFactor: 75, liquidationThreshold: 120, category: "volatile" },
  { symbol: "EMBER", logo: TOKEN_LOGOS.EMBER, totalSupplied: 8920000, totalBorrowed: 3568000, supplyAPY: 5.8, borrowAPY: 11.2, utilization: 40, collateralFactor: 70, liquidationThreshold: 120, category: "volatile" },
  { symbol: "EQT", logo: TOKEN_LOGOS.EQT, totalSupplied: 1200000, totalBorrowed: 360000, supplyAPY: 3.1, borrowAPY: 6.8, utilization: 30, collateralFactor: 65, liquidationThreshold: 115, category: "volatile" },
  { symbol: "USDC", logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=035", totalSupplied: 15800000, totalBorrowed: 11060000, supplyAPY: 6.2, borrowAPY: 9.4, utilization: 70, collateralFactor: 85, liquidationThreshold: 110, category: "stable" },
  { symbol: "WETH", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=035", totalSupplied: 5200000, totalBorrowed: 2600000, supplyAPY: 2.8, borrowAPY: 5.5, utilization: 50, collateralFactor: 80, liquidationThreshold: 115, category: "volatile" },
  { symbol: "POL", logo: "https://cryptologos.cc/logos/polygon-matic-logo.png?v=035", totalSupplied: 3100000, totalBorrowed: 1240000, supplyAPY: 3.5, borrowAPY: 7.0, utilization: 40, collateralFactor: 70, liquidationThreshold: 120, category: "volatile" },
];

const FILTERS = ["All", "Stablecoins", "Volatile", "Isolated"];

const DexMarkets = () => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedAsset, setSelectedAsset] = useState<typeof MARKETS[0] | null>(null);

  const filtered = MARKETS.filter((m) => {
    if (filter === "Stablecoins" && m.category !== "stable") return false;
    if (filter === "Volatile" && m.category !== "volatile") return false;
    if (query && !m.symbol.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const totalTVL = MARKETS.reduce((s, m) => s + m.totalSupplied, 0);

  return (
    <div className="space-y-6 py-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-foreground">Lending Markets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Supply assets to earn yield or borrow against your collateral. All markets include 0.3% protocol fee.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Market Size", value: `$${(totalTVL / 1e6).toFixed(1)}M` },
          { label: "Total Borrowed", value: `$${(MARKETS.reduce((s, m) => s + m.totalBorrowed, 0) / 1e6).toFixed(1)}M` },
          { label: "Markets", value: MARKETS.length.toString() },
          { label: "Avg Supply APY", value: `${(MARKETS.reduce((s, m) => s + m.supplyAPY, 0) / MARKETS.length).toFixed(1)}%` },
        ].map((s) => (
          <Card key={s.label} className="border-border/40 bg-card/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search markets…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 border-border/50 bg-muted/20"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f ? "bg-primary text-primary-foreground" : "border border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Markets Table */}
      <Card className="border-border/40 bg-card/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Asset</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total Supplied</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Supply APY</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total Borrowed</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Borrow APY</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <motion.tr
                  key={m.symbol}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedAsset(m)}
                  className="border-b border-border/20 cursor-pointer transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <img src={m.logo} alt="" className="h-7 w-7 rounded-full" />
                      <span className="font-semibold text-foreground">{m.symbol}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">${(m.totalSupplied / 1e6).toFixed(2)}M</td>
                  <td className="px-4 py-3 text-right font-semibold text-[hsl(142,70%,50%)]">{m.supplyAPY}%</td>
                  <td className="px-4 py-3 text-right text-foreground">${(m.totalBorrowed / 1e6).toFixed(2)}M</td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-400">{m.borrowAPY}%</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-muted-foreground">{m.utilization}%</span>
                      <div className="h-1.5 w-16 rounded-full bg-muted/40 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-fire" style={{ width: `${m.utilization}%` }} />
                      </div>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Asset Detail Modal */}
      <AssetDetailModal
        open={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        asset={selectedAsset}
      />
    </div>
  );
};

export default DexMarkets;
