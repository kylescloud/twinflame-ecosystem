import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowDownUp, ArrowRight, TrendingUp, Flame, Shield, Wallet,
  Zap, Landmark, Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";
import { simulateSwap } from "@/lib/contracts";
import { useWallet } from "@/hooks/useWallet";

const QUICK_TOKENS = [
  { symbol: "BLAZE", logo: TOKEN_LOGOS.BLAZE, color: "text-blaze" },
  { symbol: "EMBER", logo: TOKEN_LOGOS.EMBER, color: "text-ember" },
  { symbol: "EQT", logo: TOKEN_LOGOS.EQT, color: "text-equity" },
];

const FEATURED_MARKETS = [
  { asset: "BLAZE", supplyAPY: 4.2, borrowAPY: 8.5, tvl: "$2.45M", logo: TOKEN_LOGOS.BLAZE },
  { asset: "EMBER", supplyAPY: 5.8, borrowAPY: 11.2, tvl: "$8.92M", logo: TOKEN_LOGOS.EMBER },
  { asset: "EQT", supplyAPY: 3.1, borrowAPY: 6.8, tvl: "$1.2M", logo: TOKEN_LOGOS.EQT },
];

const HOT_P2P_OFFERS = [
  { lender: "0x8a3f…1b2c", token: "BLAZE", amount: 5000, rate: 6.5, duration: "30d", logo: TOKEN_LOGOS.BLAZE },
  { lender: "0x7c2d…9e4a", token: "EMBER", amount: 15000, rate: 7.2, duration: "60d", logo: TOKEN_LOGOS.EMBER },
  { lender: "0x5f1a…8b3d", token: "BLAZE", amount: 2500, rate: 5.8, duration: "14d", logo: TOKEN_LOGOS.BLAZE },
];

const DexDiscover = () => {
  const { address, connect, isConnecting } = useWallet();
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [amount, setAmount] = useState("");

  const parsed = parseFloat(amount);
  const isValid = !isNaN(parsed) && parsed > 0;
  const result = useMemo(() => {
    if (!isValid) return null;
    return simulateSwap(QUICK_TOKENS[fromIdx].symbol, QUICK_TOKENS[toIdx].symbol, parsed);
  }, [parsed, isValid, fromIdx, toIdx]);

  const flipTokens = () => { setFromIdx(toIdx); setToIdx(fromIdx); setAmount(""); };

  return (
    <div className="space-y-12 py-4">
      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-[hsl(142,70%,50%)]" />
          Live on Polygon
        </div>
        <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
          Swap & Earn on{" "}
          <span className="text-gradient-fire">Polygon</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Aggregated swaps from 1inch & QuickSwap · Pooled & P2P lending · Instant Yield Swaps — swap and start earning APY in one transaction.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/dex/trade">
            <Button className="bg-gradient-fire text-primary-foreground hover:opacity-90" size="lg">
              <Zap className="mr-1.5 h-4 w-4" /> Swap & Earn
            </Button>
          </Link>
          <Link to="/dex/market">
            <Button variant="outline" size="lg" className="border-border/50">
              <Globe className="mr-1.5 h-4 w-4" /> Explore Market
            </Button>
          </Link>
        </div>
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
            ].map((stat) => (
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
          <Link to="/dex/lend" className="text-sm text-primary hover:underline">View All →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURED_MARKETS.map((m) => (
            <Link key={m.asset} to="/dex/lend">
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
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-7">Swap & Earn</Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs h-7">Create P2P</Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Hot P2P Offers */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">🔥 Hot P2P Offers</h2>
          <Link to="/dex/lend" className="text-sm text-primary hover:underline">Browse All →</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {HOT_P2P_OFFERS.map((offer, i) => (
            <Card key={i} className="min-w-[260px] border-border/40 bg-card/60 shrink-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <img src={offer.logo} alt="" className="h-7 w-7 rounded-full" />
                  <div>
                    <p className="font-semibold text-foreground">{offer.amount.toLocaleString()} {offer.token}</p>
                    <p className="text-[10px] text-muted-foreground">by {offer.lender}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <p className="text-muted-foreground">Rate</p>
                    <p className="font-semibold text-[hsl(142,70%,50%)]">{offer.rate}% APR</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-semibold text-foreground">{offer.duration}</p>
                  </div>
                </div>
                <Link to="/dex/lend">
                  <Button size="sm" className="w-full bg-gradient-fire text-primary-foreground text-xs h-7 hover:opacity-90">
                    Accept Offer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* Top Farms Teaser */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
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

export default DexDiscover;
