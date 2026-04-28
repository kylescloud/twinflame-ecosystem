import { useState, useMemo, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Search, TrendingUp, TrendingDown, Flame, Zap, Wifi, WifiOff, RefreshCw, Loader2, ChevronDown, ArrowUpDown, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";
import { usePolygonMarketData, COINGECKO_IDS, type LiveCoinData } from "@/hooks/usePolygonMarketData";
import TokenPoolsRow from "@/components/dex/TokenPoolsRow";

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
  category?: string;
}

// Static data for native TwinFlame tokens
const NATIVE_TOKENS: CoinData[] = [
  { rank: 0, symbol: "BLAZE", name: "TwinFlame BLAZE", logo: TOKEN_LOGOS.BLAZE, price: 0.25, change24h: 12.5, marketCap: 25000000, volume24h: 3400000, supplyAPY: 4.2, trendScore: 98, isNew: true, category: "defi" },
  { rank: 0, symbol: "EMBER", name: "TwinFlame EMBER", logo: TOKEN_LOGOS.EMBER, price: 0.20, change24h: 8.7, marketCap: 20000000, volume24h: 2800000, supplyAPY: 5.8, trendScore: 92, category: "defi" },
  { rank: 0, symbol: "EQT", name: "TwinFlame Equity", logo: TOKEN_LOGOS.EQT, price: 2.50, change24h: -2.1, marketCap: 12500000, volume24h: 850000, supplyAPY: 3.1, trendScore: 65, category: "defi" },
];

// Category mapping for CoinGecko tokens
const TOKEN_CATEGORIES: Record<string, string> = {
  "matic-network": "l1", weth: "l1", "usd-coin": "stablecoin", tether: "stablecoin",
  "wrapped-bitcoin": "l1", aave: "defi", chainlink: "oracle", uniswap: "defi",
  "curve-dao-token": "defi", sushi: "defi", "the-graph": "infrastructure",
  havven: "defi", "compound-governance-token": "defi", maker: "defi",
  balancer: "defi", "1inch": "defi", dydx: "defi", "lido-dao": "defi",
  "rocket-pool": "defi", "frax-share": "defi", quickswap: "defi",
  "stargate-finance": "defi", aavegotchi: "gaming", "the-sandbox": "gaming",
  decentraland: "gaming", apecoin: "gaming", "render-token": "ai",
  "fetch-ai": "ai", "ocean-protocol": "ai", "singularitynet": "ai",
  dai: "stablecoin", frax: "stablecoin", "wrapped-steth": "defi",
  "staked-ether": "defi", "ethereum-name-service": "infrastructure",
  optimism: "l2", arbitrum: "l2", "immutable-x": "gaming",
  "axie-infinity": "gaming", gala: "gaming", illuvium: "gaming",
  "yearn-finance": "defi", pendle: "defi", gmx: "defi", magic: "gaming",
  "radiant-capital": "defi", dogecoin: "meme", "shiba-inu": "meme",
  pepe: "meme", floki: "meme", "worldcoin-wld": "ai",
  "ondo-finance": "defi", ethena: "defi", wormhole: "infrastructure",
  starknet: "l2", celestia: "l1", "sei-network": "l1", sui: "l1",
  aptos: "l1", "injective-protocol": "defi", cosmos: "l1", polkadot: "l1",
  "avalanche-2": "l1", solana: "l1", near: "l1", fantom: "l1",
  algorand: "l1", stellar: "l1", ripple: "l1", cardano: "l1",
  bittensor: "ai", filecoin: "infrastructure", "theta-token": "infrastructure",
  arweave: "infrastructure", jasmycoin: "infrastructure", chiliz: "gaming",
  enjincoin: "gaming", superfarm: "gaming", blur: "nft", looksrare: "nft",
  x2y2: "nft", "mask-network": "infrastructure", "band-protocol": "oracle",
  api3: "oracle", storj: "infrastructure", ankr: "infrastructure",
  skale: "l2", "celer-network": "infrastructure", cartesi: "l2",
  biconomy: "infrastructure", dodo: "defi", "perpetual-protocol": "defi",
  "spell-token": "defi", "kyber-network-crystal": "defi", "0x": "defi",
  "republic-protocol": "defi", omisego: "infrastructure", polymath: "defi",
  telcoin: "defi",
};

const TABS = ["All", "DeFi", "L1/L2", "Gaming", "AI", "Meme", "Stablecoin", "Gainers", "Losers"] as const;
type SortKey = "marketCap" | "price" | "change24h" | "volume24h" | "name";

const formatNum = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

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
      <polyline points={points} fill="none" stroke={positive ? "hsl(142,70%,50%)" : "hsl(0,70%,50%)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const DexMarket = () => {
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visibleCount, setVisibleCount] = useState(50);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { coins: liveCoins, loading, isLive, lastUpdated, refetch } = usePolygonMarketData();

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  // Build full coin list from live CoinGecko data + native tokens
  const allCoins = useMemo((): CoinData[] => {
    const liveMap = new Map<string, LiveCoinData>();
    liveCoins.forEach((lc) => {
      const entry = Object.entries(COINGECKO_IDS).find(([, v]) => v === lc.id);
      if (entry) liveMap.set(entry[0], lc);
    });

    const fromLive: CoinData[] = [];
    const seen = new Set<string>();

    // Add live CoinGecko tokens
    Object.entries(COINGECKO_IDS).forEach(([sym, cgId]) => {
      if (seen.has(cgId)) return;
      seen.add(cgId);
      const live = liveMap.get(sym);
      if (live) {
        fromLive.push({
          rank: live.market_cap_rank || 999,
          symbol: sym,
          name: live.name,
          logo: live.image,
          price: live.current_price ?? 0,
          change24h: live.price_change_percentage_24h ?? 0,
          marketCap: live.market_cap ?? 0,
          volume24h: live.total_volume ?? 0,
          sparkline: live.sparkline_in_7d?.price?.slice(-24),
          isLive: true,
          category: TOKEN_CATEGORIES[cgId] || "other",
          trendScore: Math.min(100, Math.abs(live.price_change_percentage_24h ?? 0) * 5 + (live.total_volume ?? 0) / 1e8),
        });
      }
    });

    // Native tokens always included
    return [...NATIVE_TOKENS, ...fromLive];
  }, [liveCoins]);

  const filtered = useMemo(() => {
    let list = [...allCoins];

    // Search filter
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    }

    // Category filter
    switch (tab) {
      case "DeFi": list = list.filter(c => c.category === "defi"); break;
      case "L1/L2": list = list.filter(c => c.category === "l1" || c.category === "l2"); break;
      case "Gaming": list = list.filter(c => c.category === "gaming"); break;
      case "AI": list = list.filter(c => c.category === "ai"); break;
      case "Meme": list = list.filter(c => c.category === "meme"); break;
      case "Stablecoin": list = list.filter(c => c.category === "stablecoin"); break;
      case "Gainers": list = list.filter(c => c.change24h > 0).sort((a, b) => b.change24h - a.change24h); return list;
      case "Losers": list = list.filter(c => c.change24h < 0).sort((a, b) => a.change24h - b.change24h); return list;
    }

    // Sort
    const dir = sortDir === "desc" ? -1 : 1;
    list.sort((a, b) => {
      switch (sortBy) {
        case "name": return dir * a.name.localeCompare(b.name);
        case "price": return dir * (a.price - b.price);
        case "change24h": return dir * (a.change24h - b.change24h);
        case "volume24h": return dir * (a.volume24h - b.volume24h);
        default: return dir * (a.marketCap - b.marketCap);
      }
    });

    return list;
  }, [tab, query, allCoins, sortBy, sortDir]);

  const visible = filtered.slice(0, visibleCount);

  const SortHeader = ({ label, sortKey, className = "" }: { label: string; sortKey: SortKey; className?: string }) => (
    <th
      className={`px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none ${className}`}
      onClick={() => toggleSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === sortKey && (
          <ArrowUpDown className="h-3 w-3 text-primary" />
        )}
      </span>
    </th>
  );

  return (
    <div className="space-y-6 py-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Polygon Market</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {allCoins.length} tokens — swap & earn APY in one click.
            </p>
          </div>
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

      {/* Search + Category Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, symbol, or category…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setVisibleCount(50); }}
            className="pl-9 border-border/50 bg-muted/20"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setVisibleCount(50); }}
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
                <SortHeader label="Token" sortKey="name" className="text-left" />
                <SortHeader label="Price" sortKey="price" className="text-right" />
                <SortHeader label="24h" sortKey="change24h" className="text-right" />
                <SortHeader label="Market Cap" sortKey="marketCap" className="text-right hidden sm:table-cell" />
                <SortHeader label="Volume" sortKey="volume24h" className="text-right hidden md:table-cell" />
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">7d</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {visible.map((coin, i) => (
                  <Fragment key={coin.symbol}>
                  <motion.tr
                    key={coin.symbol}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: Math.min(i * 0.01, 0.3) }}
                    layout
                    className="border-b border-border/20 transition-colors hover:bg-muted/20 cursor-pointer"
                    onClick={() => navigate(`/dex/token/${coin.symbol.toLowerCase()}`)}
                  >
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      <div className="flex items-center gap-1">
                        {(coin.trendScore || 0) > 90 && <Flame className="h-3 w-3 text-blaze" />}
                        {coin.rank > 0 ? coin.rank : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img src={coin.logo} alt="" className="h-7 w-7 rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-foreground">{coin.symbol}</span>
                            {coin.isLive && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(142,70%,50%)]" title="Live" />}
                          </div>
                          <div className="flex items-center gap-1">
                            <p className="text-[10px] text-muted-foreground">{coin.name}</p>
                            {coin.category && (
                              <span className="rounded bg-muted/30 px-1 py-0.5 text-[8px] uppercase text-muted-foreground">{coin.category}</span>
                            )}
                          </div>
                        </div>
                        {coin.isNew && (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">NEW</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground tabular-nums">
                      ${coin.price < 0.01 ? coin.price.toFixed(6) : coin.price < 1 ? coin.price.toFixed(4) : coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${coin.change24h >= 0 ? "text-[hsl(142,70%,50%)]" : "text-destructive"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {coin.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span className="tabular-nums">{coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-foreground hidden sm:table-cell tabular-nums">{formatNum(coin.marketCap)}</td>
                    <td className="px-4 py-3 text-right text-foreground hidden md:table-cell tabular-nums">{formatNum(coin.volume24h)}</td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      {coin.sparkline ? <MiniSparkline data={coin.sparkline} positive={coin.change24h >= 0} /> : <span className="text-muted-foreground text-[10px]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] px-2 border-border/50"
                          onClick={() => {
                            setExpanded((prev) => {
                              const next = new Set(prev);
                              next.has(coin.symbol) ? next.delete(coin.symbol) : next.add(coin.symbol);
                              return next;
                            });
                          }}
                        >
                          <ChevronDown className={`mr-0.5 h-3 w-3 transition-transform ${expanded.has(coin.symbol) ? "rotate-180" : ""}`} />
                          Pools
                        </Button>
                        <Link to="/dex/trade">
                          <Button size="sm" className="h-7 bg-gradient-fire text-primary-foreground text-[10px] px-2 hover:opacity-90">
                            <Zap className="mr-0.5 h-3 w-3" /> Swap
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                  {expanded.has(coin.symbol) && (
                    <TokenPoolsRow key={`${coin.symbol}-pools`} symbol={coin.symbol} colSpan={8} />
                  )}
                </Fragment>
              ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No tokens found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Load More */}
        {visibleCount < filtered.length && (
          <div className="flex justify-center border-t border-border/20 p-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVisibleCount(v => v + 50)}
              className="gap-1.5"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Load More ({filtered.length - visibleCount} remaining)
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DexMarket;
