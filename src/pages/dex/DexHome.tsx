import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowDownUp, ArrowRight, TrendingUp, Flame, Shield, Wallet,
  LayoutDashboard, Sprout, ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";
import { simulateSwap, FEE_CONFIG, NATIVE_USD_PRICES } from "@/lib/contracts";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import TokenSelectorModal, { type TokenDef } from "@/components/dex/TokenSelectorModal";
import { usePolygonMarketData, COINGECKO_IDS } from "@/hooks/usePolygonMarketData";

const NATIVE_TOKENS: TokenDef[] = [
  { symbol: "BLAZE", name: "TwinFlame BLAZE", logo: TOKEN_LOGOS.BLAZE, balance: "0.00", color: "text-blaze" },
  { symbol: "EMBER", name: "TwinFlame EMBER", logo: TOKEN_LOGOS.EMBER, balance: "0.00", color: "text-ember" },
  { symbol: "EQT",   name: "TwinFlame Equity", logo: TOKEN_LOGOS.EQT,  balance: "0.00", color: "text-equity" },
];

const FEATURED_MARKETS = [
  { asset: "BLAZE", supplyAPY: 4.2, borrowAPY: 8.5, tvl: "$2.45M", logo: TOKEN_LOGOS.BLAZE },
  { asset: "EMBER", supplyAPY: 5.8, borrowAPY: 11.2, tvl: "$8.92M", logo: TOKEN_LOGOS.EMBER },
  { asset: "EQT", supplyAPY: 3.1, borrowAPY: 6.8, tvl: "$1.2M", logo: TOKEN_LOGOS.EQT },
];

const DexHome = () => {
  const { address, connect, isConnecting } = useWallet();
  const { toast } = useToast();
  const { coins } = usePolygonMarketData();

  const allTokens: TokenDef[] = useMemo(() => {
    const market: TokenDef[] = Object.keys(COINGECKO_IDS).map((sym) => {
      const c = coins.find((co) => co.id === COINGECKO_IDS[sym]);
      return {
        symbol: sym,
        name: c?.name ?? sym,
        logo: c?.image ?? "https://cryptologos.cc/logos/polygon-matic-logo.png?v=035",
        balance: "0.00",
        color: "text-foreground",
      };
    });
    const seen = new Set<string>();
    return [...NATIVE_TOKENS, ...market].filter((t) => {
      if (seen.has(t.symbol)) return false;
      seen.add(t.symbol);
      return true;
    });
  }, [coins]);

  const priceUsd = (symbol: string): number | undefined => {
    if (NATIVE_USD_PRICES[symbol] !== undefined) return NATIVE_USD_PRICES[symbol];
    const cgId = COINGECKO_IDS[symbol];
    if (!cgId) return undefined;
    const c = coins.find((co) => co.id === cgId);
    return c?.current_price ?? undefined;
  };

  const [fromToken, setFromToken] = useState<TokenDef>(NATIVE_TOKENS[0]);
  const [toToken, setToToken] = useState<TokenDef>(NATIVE_TOKENS[1]);
  const [amount, setAmount] = useState("");
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);

  const parsed = parseFloat(amount);
  const isValid = !isNaN(parsed) && parsed > 0;
  const result = useMemo(() => {
    if (!isValid) return null;
    return simulateSwap(
      fromToken.symbol,
      toToken.symbol,
      parsed,
      priceUsd(fromToken.symbol),
      priceUsd(toToken.symbol),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed, isValid, fromToken.symbol, toToken.symbol, coins]);

  const flipTokens = () => { const f = fromToken; setFromToken(toToken); setToToken(f); setAmount(""); };

  const handleFromSelect = (t: TokenDef) => {
    if (t.symbol === toToken.symbol) setToToken(fromToken);
    setFromToken(t); setAmount("");
  };
  const handleToSelect = (t: TokenDef) => {
    if (t.symbol === fromToken.symbol) setFromToken(toToken);
    setToToken(t); setAmount("");
  };

  return (
    <div className="space-y-12 py-4">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-[hsl(142,70%,50%)]" />
          Live on Polygon
        </div>
        <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
          Swap & Earn on{" "}
          <span className="text-gradient-fire">Polygon</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Trade BLAZE, EMBER & EQT with built-in burn mechanics. Every swap fuels the ecosystem.
        </p>
      </motion.section>

      {/* Quick Swap + Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Mini Swap Widget */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/60 bg-card glow-fire">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-foreground">Quick Swap</h2>
                <Link to="/dex/trade" className="text-xs text-primary hover:underline">Advanced →</Link>
              </div>

              {/* From */}
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">You send</label>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2.5 py-1.5 text-sm font-bold">
                    <img src={QUICK_TOKENS[fromIdx].logo} alt="" className="h-5 w-5 rounded-full" />
                    <span className={QUICK_TOKENS[fromIdx].color}>{QUICK_TOKENS[fromIdx].symbol}</span>
                  </button>
                  <Input
                    type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="border-none bg-transparent text-right text-lg font-semibold focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="flex justify-center -my-1">
                <button onClick={flipTokens} className="rounded-full border border-border bg-muted p-2 text-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                  <ArrowDownUp className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* To */}
              <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">You receive</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-md bg-muted/30 px-2.5 py-1.5 text-sm font-bold">
                    <img src={QUICK_TOKENS[toIdx].logo} alt="" className="h-5 w-5 rounded-full" />
                    <span className={QUICK_TOKENS[toIdx].color}>{QUICK_TOKENS[toIdx].symbol}</span>
                  </div>
                  <div className="flex-1 text-right text-lg font-semibold text-foreground">
                    {result ? result.amountOut.toFixed(4) : "0.00"}
                  </div>
                </div>
              </div>

              {result && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Fee: {result.fee.toFixed(6)} (0.3%)</span>
                  <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-blaze" /> {result.burnAmount.toFixed(6)} burned</span>
                </div>
              )}

              {!address ? (
                <Button onClick={connect} disabled={isConnecting} className="w-full bg-gradient-fire text-primary-foreground" size="lg">
                  <Wallet className="mr-1.5 h-4 w-4" />
                  {isConnecting ? "Connecting…" : "Connect Wallet"}
                </Button>
              ) : (
                <Link to="/dex/trade">
                  <Button className="w-full bg-gradient-fire text-primary-foreground hover:opacity-90" size="lg">
                    Go to Trade <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Live Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Value Locked", value: "$12.57M", icon: Shield, color: "text-primary" },
              { label: "24h Volume", value: "$1.82M", icon: TrendingUp, color: "text-[hsl(142,70%,50%)]" },
              { label: "Fees Earned Today", value: "$5,460", icon: Flame, color: "text-blaze" },
              { label: "BLAZE Burned", value: "142,500", icon: Flame, color: "text-ember" },
            ].map((stat, i) => (
              <Card key={stat.label} className="border-border/40 bg-card/60">
                <CardContent className="p-4">
                  <stat.icon className={`mb-2 h-5 w-5 ${stat.color}`} />
                  <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Featured Markets */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Featured Markets</h2>
          <Link to="/dex/markets" className="text-sm text-primary hover:underline">View All →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURED_MARKETS.map((m) => (
            <Link key={m.asset} to="/dex/markets">
              <Card className="border-border/40 bg-card/60 transition-colors hover:border-primary/30">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <img src={m.logo} alt="" className="h-8 w-8 rounded-full" />
                    <span className="font-display font-bold text-foreground">{m.asset}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Supply APY</p>
                      <p className="font-semibold text-[hsl(142,70%,50%)]">{m.supplyAPY}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Borrow APY</p>
                      <p className="font-semibold text-amber-400">{m.borrowAPY}%</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">TVL: {m.tvl}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Top Farms Teaser */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Top Farms</h2>
          <Link to="/dex/earn" className="text-sm text-primary hover:underline">Explore All →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { pool: "BLAZE Supply", apr: "14.2%", rewards: "EMBER", logo: TOKEN_LOGOS.BLAZE },
            { pool: "EMBER Supply", apr: "18.5%", rewards: "BLAZE", logo: TOKEN_LOGOS.EMBER },
          ].map((f) => (
            <Card key={f.pool} className="border-border/40 bg-card/60">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <img src={f.logo} alt="" className="h-8 w-8 rounded-full" />
                  <div>
                    <p className="font-semibold text-foreground">{f.pool}</p>
                    <p className="text-xs text-muted-foreground">Rewards in {f.rewards}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-[hsl(142,70%,50%)]">{f.apr}</p>
                  <p className="text-[10px] text-muted-foreground">APR</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default DexHome;
