import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Search, TrendingUp, TrendingDown, Flame, Zap, Wifi, WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";
import { usePolygonMarketData, COINGECKO_IDS, type LiveCoinData } from "@/hooks/usePolygonMarketData";

interface CoinData {
  rank: number;
  symbol: string;
  name: string;
  logo: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  supplyAPY?: number;
  isNew?: boolean;
  trendScore?: number;
  sparkline?: number[];
  isLive?: boolean;
}

// Static fallback data for native tokens + defaults
const STATIC_COINS: CoinData[] = [
  { rank: 1, symbol: "POL", name: "Polygon", logo: "https://cryptologos.cc/logos/polygon-matic-logo.png?v=035", price: 0.52, change24h: 3.4, marketCap: 5200000000, volume24h: 320000000, supplyAPY: 3.5, trendScore: 95 },
  { rank: 2, symbol: "WETH", name: "Wrapped Ether", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=035", price: 3450, change24h: 1.2, marketCap: 415000000000, volume24h: 18000000000, supplyAPY: 2.8, trendScore: 88 },
  { rank: 3, symbol: "USDC", name: "USD Coin", logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=035", price: 1.0, change24h: 0.01, marketCap: 33000000000, volume24h: 5800000000, supplyAPY: 6.2, trendScore: 70 },
  { rank: 4, symbol: "BLAZE", name: "TwinFlame BLAZE", logo: TOKEN_LOGOS.BLAZE, price: 0.25, change24h: 12.5, marketCap: 25000000, volume24h: 3400000, supplyAPY: 4.2, trendScore: 98, isNew: true },
  { rank: 5, symbol: "EMBER", name: "TwinFlame EMBER", logo: TOKEN_LOGOS.EMBER, price: 0.20, change24h: 8.7, marketCap: 20000000, volume24h: 2800000, supplyAPY: 5.8, trendScore: 92 },
  { rank: 6, symbol: "EQT", name: "TwinFlame Equity", logo: TOKEN_LOGOS.EQT, price: 2.50, change24h: -2.1, marketCap: 12500000, volume24h: 850000, supplyAPY: 3.1, trendScore: 65 },
  { rank: 7, symbol: "WBTC", name: "Wrapped Bitcoin", logo: "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png?v=035", price: 98500, change24h: 0.8, marketCap: 13500000000, volume24h: 580000000, trendScore: 80 },
  { rank: 8, symbol: "AAVE", name: "Aave", logo: "https://cryptologos.cc/logos/aave-aave-logo.png?v=035", price: 285, change24h: -3.4, marketCap: 4200000000, volume24h: 210000000, trendScore: 72 },
  { rank: 9, symbol: "LINK", name: "Chainlink", logo: "https://cryptologos.cc/logos/chainlink-link-logo.png?v=035", price: 18.5, change24h: 5.2, marketCap: 11000000000, volume24h: 850000000, trendScore: 85 },
  { rank: 10, symbol: "QCK", name: "QuickSwap", logo: "https://cryptologos.cc/logos/quickswap-quick-logo.png?v=035", price: 42, change24h: -1.8, marketCap: 320000000, volume24h: 45000000, isNew: true, trendScore: 60 },
];

const TABS = ["Top Coins", "New Coins", "Gainers", "Losers", "Trending"] as const;

const formatNum = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

// Tiny inline sparkline SVG
const MiniSparkline = ({ data, positive }: { data: number[]; positive: boolean }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="inline-block ml-1">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "hsl(142,70%,50%)" : "hsl(0,70%,50%)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const DexMarket = () => {
  const [tab, setTab] = useState<typeof TABS[number]>("Top Coins");
  const [query, setQuery] = useState("");
  const { coins: liveCoins, loading, isLive, lastUpdated, refetch } = usePolygonMarketData();

  // Merge live CoinGecko data with static data
  const mergedCoins = useMemo((): CoinData[] => {
    const liveMap = new Map<string, LiveCoinData>();
    liveCoins.forEach((lc) => {
      // Map CoinGecko id back to our symbol
      const entry = Object.entries(COINGECKO_IDS).find(([, v]) => v === lc.id);
      if (entry) liveMap.set(entry[0], lc);
    });

    return STATIC_COINS.map((sc) => {
      const live = liveMap.get(sc.symbol);
      if (live) {
        return {
          ...sc,
          price: live.current_price,
          change24h: live.price_change_percentage_24h ?? sc.change24h,
          marketCap: live.market_cap ?? sc.marketCap,
          volume24h: live.total_volume ?? sc.volume24h,
          logo: live.image || sc.logo,
          sparkline: live.sparkline_in_7d?.price?.slice(-24), // last 24 points
          isLive: true,
        };
      }
      // Native tokens (BLAZE, EMBER, EQT) keep static data
      return { ...sc, isLive: false };
    });
  }, [liveCoins]);

  const filtered = useMemo(() => {
    let list = [...mergedCoins];
    if (query) list = list.filter((c) => c.symbol.toLowerCase().includes(query.toLowerCase()) || c.name.toLowerCase().includes(query.toLowerCase()));
    switch (tab) {
      case "New Coins": return list.filter((c) => c.isNew);
      case "Gainers": return list.filter((c) => c.change24h > 0).sort((a, b) => b.change24h - a.change24h);
      case "Losers": return list.filter((c) => c.change24h < 0).sort((a, b) => a.change24h - b.change24h);
      case "Trending": return list.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
      default: return list.sort((a, b) => b.marketCap - a.marketCap);
    }
  }, [tab, query, mergedCoins]);

  return (
    <div className="space-y-6 py-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Polygon Market</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Discover tokens on Polygon — swap & earn APY in one click.
            </p>
          </div>
          {/* Live status indicator */}
          <div className="flex items-center gap-2">
            <button onClick={refetch} className="p-1.5 rounded-md hover:bg-muted/30 transition-colors" title="Refresh prices">
              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/20 px-2.5 py-1">
              {isLive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(142,70%,50%)] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(142,70%,50%)]" />
                  </span>
                  <span className="text-[10px] font-medium text-[hsl(142,70%,50%)]">LIVE</span>
                </>
              ) : loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground">Loading…</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground">Cached</span>
                </>
              )}
            </div>
            {lastUpdated && (
              <span className="text-[9px] text-muted-foreground hidden sm:block">
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Search + Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tokens…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 border-border/50 bg-muted/20"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                tab === t ? "bg-primary text-primary-foreground" : "border border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Coins Table */}
      <Card className="border-border/40 bg-card/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Token</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">24h</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">Market Cap</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden md:table-cell">Volume</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">7d Chart</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">Supply APY</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtered.map((coin, i) => (
                  <motion.tr
                    key={coin.symbol}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.02 }}
                    layout
                    className="border-b border-border/20 transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        {tab === "Trending" && (coin.trendScore || 0) > 90 && <Flame className="h-3 w-3 text-blaze" />}
                        {coin.rank}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={coin.logo} alt="" className="h-7 w-7 rounded-full" />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-foreground">{coin.symbol}</span>
                            {coin.isLive && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(142,70%,50%)]" title="Live price" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{coin.name}</p>
                        </div>
                        {coin.isNew && (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">NEW</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">
                      <motion.span
                        key={coin.price}
                        initial={{ color: "hsl(var(--foreground))" }}
                        animate={{ color: "hsl(var(--foreground))" }}
                        className="tabular-nums"
                      >
                        ${coin.price < 1 ? coin.price.toFixed(4) : coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </motion.span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${coin.change24h >= 0 ? "text-[hsl(142,70%,50%)]" : "text-destructive"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {coin.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span className="tabular-nums">
                          {coin.change24h >= 0 ? "+" : ""}{coin.change24h?.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-foreground hidden sm:table-cell tabular-nums">{formatNum(coin.marketCap)}</td>
                    <td className="px-4 py-3 text-right text-foreground hidden md:table-cell tabular-nums">{formatNum(coin.volume24h)}</td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      {coin.sparkline ? (
                        <MiniSparkline data={coin.sparkline} positive={coin.change24h >= 0} />
                      ) : (
                        <span className="text-muted-foreground text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      {coin.supplyAPY ? (
                        <span className="font-semibold text-[hsl(142,70%,50%)]">{coin.supplyAPY}%</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to="/dex/trade">
                          <Button size="sm" className="h-7 bg-gradient-fire text-primary-foreground text-[10px] px-2 hover:opacity-90">
                            <Zap className="mr-0.5 h-3 w-3" /> Swap & Earn
                          </Button>
                        </Link>
                        <Link to="/dex/lend">
                          <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 hidden lg:flex">
                            Create P2P
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">No tokens found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DexMarket;
