import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownUp, Settings2, Clock, Check, Flame, TrendingUp,
  Shield, Zap, ChevronDown, ExternalLink, Wallet,
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";
import { simulateSwap, FEE_CONFIG, CONTRACTS, NATIVE_USD_PRICES } from "@/lib/contracts";
import TokenSelectorModal, { type TokenDef } from "@/components/dex/TokenSelectorModal";
import { usePolygonMarketData, COINGECKO_IDS } from "@/hooks/usePolygonMarketData";

const SLIPPAGE_OPTS = [0.1, 0.5, 1.0];

interface SwapTx {
  id: string; from: string; to: string; amountIn: number; amountOut: number; fee: number; date: Date; status: "completed" | "pending";
}

const timeAgo = (d: Date) => {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const SUPPLY_APY: Record<string, number> = {
  BLAZE: 4.2, EMBER: 5.8, EQT: 3.1, USDC: 6.4, USDT: 6.1, DAI: 5.9,
  WETH: 3.2, WBTC: 2.4, POL: 4.8,
};

const NATIVE_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  BLAZE: { color: "text-blaze", bg: "bg-blaze/10", border: "border-blaze/30" },
  EMBER: { color: "text-ember", bg: "bg-ember/10", border: "border-ember/30" },
  EQT:   { color: "text-equity", bg: "bg-equity/10", border: "border-equity/30" },
};
const styleFor = (symbol: string) =>
  NATIVE_STYLE[symbol] ?? { color: "text-foreground", bg: "bg-muted/20", border: "border-border/40" };

const DexTrade = () => {
  const { address, connect, isConnecting, shortAddress } = useWallet();
  const { toast } = useToast();
  const { coins } = usePolygonMarketData();

  // Unified token list: native trinity + all live Polygon market tokens
  const allTokens: TokenDef[] = useMemo(() => {
    const native: TokenDef[] = [
      { symbol: "BLAZE", name: "TwinFlame BLAZE", logo: TOKEN_LOGOS.BLAZE, balance: "0.00", color: "text-blaze" },
      { symbol: "EMBER", name: "TwinFlame EMBER", logo: TOKEN_LOGOS.EMBER, balance: "0.00", color: "text-ember" },
      { symbol: "EQT",   name: "TwinFlame Equity", logo: TOKEN_LOGOS.EQT,  balance: "0.00", color: "text-equity" },
    ];
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
    return [...native, ...market].filter((t) => {
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

  const [fromToken, setFromToken] = useState<TokenDef>({
    symbol: "BLAZE", name: "TwinFlame BLAZE", logo: TOKEN_LOGOS.BLAZE, balance: "0.00", color: "text-blaze",
  });
  const [toToken, setToToken] = useState<TokenDef>({
    symbol: "EMBER", name: "TwinFlame EMBER", logo: TOKEN_LOGOS.EMBER, balance: "0.00", color: "text-ember",
  });
  const [inputAmount, setInputAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [txHistory, setTxHistory] = useState<SwapTx[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);
  const [instantYield, setInstantYield] = useState(true);

  const fromStyle = styleFor(fromToken.symbol);
  const toStyle = styleFor(toToken.symbol);
  const parsed = parseFloat(inputAmount);
  const isValid = !isNaN(parsed) && parsed > 0;

  const swapResult = useMemo(() => {
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

  const minReceived = swapResult ? swapResult.amountOut * (1 - slippage / 100) : 0;
  const usdValueIn = isValid ? parsed * (priceUsd(fromToken.symbol) ?? 0) : 0;

  const flipTokens = () => {
    const f = fromToken; setFromToken(toToken); setToToken(f); setInputAmount("");
  };

  const handleFromSelect = (token: TokenDef) => {
    if (token.symbol === toToken.symbol) setToToken(fromToken);
    setFromToken(token);
    setInputAmount("");
  };

  const handleToSelect = (token: TokenDef) => {
    if (token.symbol === fromToken.symbol) setFromToken(toToken);
    setToToken(token);
    setInputAmount("");
  };

  const handleCustomSlippage = (val: string) => {
    setCustomSlippage(val);
    const p = parseFloat(val);
    if (!isNaN(p) && p > 0 && p <= 50) setSlippage(p);
  };

  const toAPY = SUPPLY_APY[toToken.symbol] || 0;
  const projected7dEarnings = swapResult && instantYield && toAPY > 0
    ? (swapResult.amountOut * (toAPY / 100) * (7 / 365))
    : 0;

  const handleSwap = async () => {
    if (!isValid || !address || !swapResult) return;
    setIsSwapping(true);
    await new Promise((r) => setTimeout(r, 1500));

    const newTx: SwapTx = {
      id: `0x${Math.random().toString(16).slice(2, 10)}`,
      from: fromToken.symbol, to: toToken.symbol,
      amountIn: parsed, amountOut: swapResult.amountOut,
      fee: swapResult.fee, date: new Date(), status: "completed",
    };
    setTxHistory((prev) => [newTx, ...prev]);
    setInputAmount("");
    setIsSwapping(false);

    toast({
      title: instantYield && toAPY > 0 ? "Swap & Supply Executed ⚡" : "Swap Executed",
      description: instantYield && toAPY > 0
        ? `${parsed.toLocaleString()} ${fromToken.symbol} → ${swapResult.amountOut.toFixed(4)} ${toToken.symbol} supplied at ${toAPY}% APY. Fee: ${swapResult.fee.toFixed(6)}`
        : `${parsed.toLocaleString()} ${fromToken.symbol} → ${swapResult.amountOut.toFixed(4)} ${toToken.symbol} | Fee: ${swapResult.fee.toFixed(6)}`,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Chart + Info Column */}
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={fromToken.logo} alt="" className="h-8 w-8 rounded-full" />
                  <span className="text-2xl font-bold text-foreground">{fromToken.symbol}/{toToken.symbol}</span>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground">
                    {swapResult ? (swapResult.amountOut / (parsed || 1)).toFixed(4) : "1.0500"}
                  </p>
                  <p className="text-xs text-[hsl(142,70%,50%)]">+2.34%</p>
                </div>
              </div>
              {/* Simulated Chart */}
              <div className="flex h-64 items-end gap-[2px] rounded-lg bg-muted/10 p-4">
                {Array.from({ length: 60 }, (_, i) => {
                  const h = 30 + Math.sin(i * 0.3) * 20 + Math.random() * 25;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary/80 transition-all hover:from-primary/60 hover:to-primary"
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                {["1H", "24H", "1W", "1M", "1Y"].map((p) => (
                  <button key={p} className="flex-1 rounded-md border border-border/40 bg-muted/20 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                    {p}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Route Visualization */}
        {isValid && swapResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/40 bg-card/60">
              <CardContent className="p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Best Route</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-3 py-2">
                    <img src={fromToken.logo} alt="" className="h-5 w-5 rounded-full" />
                    <span className="text-sm font-bold">{fromToken.symbol}</span>
                  </div>
                  <div className="flex-1 border-t border-dashed border-primary/40 relative">
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card border border-primary/30 px-2 py-0.5 text-[10px] text-primary font-medium">
                      TwinFlame Router
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-3 py-2">
                    <img src={toToken.logo} alt="" className="h-5 w-5 rounded-full" />
                    <span className="text-sm font-bold">{toToken.symbol}</span>
                  </div>
                </div>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  Price impact: &lt;0.01% • Fee: 0.3% → Treasury
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Transaction History */}
        {txHistory.length > 0 && (
          <Card className="border-border/40 bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" /> Recent Swaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {txHistory.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between border-b border-border/20 pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <ArrowDownUp className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{tx.from} → {tx.to}</p>
                        <p className="text-[10px] text-muted-foreground">{timeAgo(tx.date)} • {tx.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{tx.amountOut.toFixed(4)} {tx.to}</p>
                      <Check className="ml-auto h-3 w-3 text-[hsl(142,70%,50%)]" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Swap Card Column */}
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/60 bg-card glow-fire sticky top-20">
            <CardContent className="space-y-4 p-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-foreground">Swap</h2>
                <div className="flex items-center gap-2">
                  {address && (
                    <span className="rounded-md border border-border/50 bg-muted/30 px-2 py-1 text-xs font-mono text-muted-foreground">
                      {shortAddress}
                    </span>
                  )}
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="rounded-md border border-border/50 bg-muted/30 p-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Slippage Settings */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2">
                      <p className="text-xs font-medium text-foreground">Slippage Tolerance</p>
                      <div className="flex items-center gap-1.5">
                        {SLIPPAGE_OPTS.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => { setSlippage(opt); setCustomSlippage(""); }}
                            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                              slippage === opt && !customSlippage ? "bg-primary text-primary-foreground" : "border border-border/50 bg-background/60 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {opt}%
                          </button>
                        ))}
                        <div className="relative flex-1">
                          <Input
                            type="number" min="0.01" max="50" step="0.1" placeholder="Custom"
                            value={customSlippage} onChange={(e) => handleCustomSlippage(e.target.value)}
                            className="h-8 border-border/50 bg-background/60 pr-6 text-xs"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                      {slippage > 5 && <p className="text-xs text-destructive">⚠ High slippage</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* From */}
              <div className={`rounded-lg border ${fromStyle.border} ${fromStyle.bg} p-4`}>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">You send</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFromSelector(true)}
                    className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm font-bold transition-colors hover:bg-muted/60"
                  >
                    <img src={fromToken.logo} alt="" className="h-6 w-6 rounded-full" />
                    <span className={fromStyle.color}>{fromToken.symbol}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <Input
                    type="number" min="0" step="any" placeholder="0.00"
                    value={inputAmount} onChange={(e) => setInputAmount(e.target.value)}
                    className="border-none bg-transparent text-right text-xl font-semibold focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* Flip */}
              <div className="flex justify-center -my-2 relative z-10">
                <motion.button
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                  onClick={flipTokens}
                  className="rounded-full border border-border bg-muted p-2.5 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                >
                  <ArrowDownUp className="h-4 w-4" />
                </motion.button>
              </div>

              {/* To */}
              <div className={`rounded-lg border ${toStyle.border} ${toStyle.bg} p-4`}>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">You receive</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowToSelector(true)}
                    className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm font-bold transition-colors hover:bg-muted/60"
                  >
                    <img src={toToken.logo} alt="" className="h-6 w-6 rounded-full" />
                    <span className={toStyle.color}>{toToken.symbol}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <div className="flex-1 text-right text-xl font-semibold text-foreground">
                    {swapResult ? swapResult.amountOut.toFixed(4) : "0.00"}
                  </div>
                </div>
              </div>

              {/* Details */}
              <AnimatePresence>
                {isValid && swapResult && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="space-y-1.5 rounded-lg border border-border/40 bg-muted/30 p-3 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Rate</span>
                        <span>1 {fromToken.symbol} = {(swapResult.amountOut / parsed).toFixed(4)} {toToken.symbol}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Protocol Fee (0.3%)</span>
                        <span>{swapResult.fee.toFixed(6)} {toToken.symbol}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> Burned (50%)</span>
                        <span>{swapResult.burnAmount.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Staker Rewards (30%)</span>
                        <span>{swapResult.rewardAmount.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>EQT Dividends (20%)</span>
                        <span>{swapResult.dividendAmount.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between font-medium text-foreground border-t border-border/30 pt-1.5">
                        <span>Min. Received</span>
                        <span>{minReceived.toFixed(4)} {toToken.symbol}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Instant Yield Swaps Toggle */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Instant Yield Swaps</span>
                  </div>
                  <button
                    onClick={() => setInstantYield(!instantYield)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${instantYield ? "bg-primary" : "bg-muted"}`}
                  >
                    <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-primary-foreground transition-transform ${instantYield ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                </div>
                {instantYield && toAPY > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    Auto-supply {toToken.symbol} to lending pool at <span className="text-[hsl(142,70%,50%)] font-semibold">{toAPY}% APY</span>
                    {projected7dEarnings > 0 && <> · 7d projection: <span className="text-foreground font-medium">+{projected7dEarnings.toFixed(4)} {toToken.symbol}</span></>}
                  </p>
                )}
                {instantYield && toAPY === 0 && (
                  <p className="text-[10px] text-muted-foreground">No lending pool available for {toToken.symbol}</p>
                )}
              </div>

              {/* Contract */}
              <div className="flex items-center justify-between rounded-md border border-border/30 bg-muted/10 px-3 py-1.5">
                <span className="text-[10px] text-muted-foreground">Router: {CONTRACTS.TWINFLAME_SWAP.slice(0, 10)}…</span>
                <a href={`https://polygonscan.com/address/${CONTRACTS.TWINFLAME_SWAP}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                  Polygonscan <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>

              {/* Action */}
              {!address ? (
                <Button onClick={connect} disabled={isConnecting} className="w-full bg-gradient-fire text-primary-foreground hover:opacity-90" size="lg">
                  <Wallet className="mr-1.5 h-4 w-4" />
                  {isConnecting ? "Connecting…" : "Connect Wallet to Swap"}
                </Button>
              ) : (
                <Button
                  disabled={!isValid || isSwapping}
                  onClick={handleSwap}
                  className="w-full bg-gradient-fire text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  size="lg"
                >
                  {isSwapping ? (
                    <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Executing…</span>
                  ) : !isValid ? "Enter an amount" : instantYield ? `Swap & Earn ${toToken.symbol}` : `Swap ${fromToken.symbol} → ${toToken.symbol}`}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Fee Cards */}
        <div className="grid gap-3">
          {[
            { icon: Flame, title: "Buyback & Burn", desc: "50% of swap fees", color: "text-blaze" },
            { icon: Zap, title: "Staker Rewards", desc: "30% to stakers", color: "text-ember" },
            { icon: TrendingUp, title: "EQT Dividends", desc: "20% quarterly", color: "text-equity" },
          ].map((c) => (
            <Card key={c.title} className="border-border/40 bg-card/60">
              <CardContent className="flex items-center gap-3 p-3">
                <c.icon className={`h-5 w-5 ${c.color}`} />
                <div>
                  <h3 className="text-xs font-semibold text-foreground">{c.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Token Selector Modals */}
      <TokenSelectorModal
        open={showFromSelector}
        onClose={() => setShowFromSelector(false)}
        onSelect={handleFromSelect}
        excludeSymbol={toToken.symbol}
        tokens={allTokens}
      />
      <TokenSelectorModal
        open={showToSelector}
        onClose={() => setShowToSelector(false)}
        onSelect={handleToSelect}
        excludeSymbol={fromToken.symbol}
        tokens={allTokens}
      />
    </div>
  );
};

export default DexTrade;
