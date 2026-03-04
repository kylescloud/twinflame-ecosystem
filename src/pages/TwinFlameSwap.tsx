import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownUp, ArrowLeft, Settings2, Clock, Check, Flame, TrendingUp,
  Shield, Zap, ChevronDown, ExternalLink, BookOpen, Wallet, Landmark,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";
import { simulateSwap, FEE_CONFIG, CONTRACTS } from "@/lib/contracts";
import EmberParticles from "@/components/EmberParticles";

// ── Token definitions ──
const TOKENS = [
  { symbol: "BLAZE", logo: TOKEN_LOGOS.BLAZE, color: "text-blaze", bg: "bg-blaze/10", border: "border-blaze/30", anim: "animate-blaze-burn" },
  { symbol: "EMBER", logo: TOKEN_LOGOS.EMBER, color: "text-ember", bg: "bg-ember/10", border: "border-ember/30", anim: "animate-ember-float" },
  { symbol: "EQT", logo: TOKEN_LOGOS.EQT, color: "text-equity", bg: "bg-equity/10", border: "border-equity/30", anim: "animate-eqt-breathe" },
];

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

// ── Component ──
const TwinFlameSwap = () => {
  const { address, connect, isConnecting, shortAddress } = useWallet();
  const { toast } = useToast();

  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [inputAmount, setInputAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showFromSelect, setShowFromSelect] = useState(false);
  const [showToSelect, setShowToSelect] = useState(false);
  const [txHistory, setTxHistory] = useState<SwapTx[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);

  const fromToken = TOKENS[fromIdx];
  const toToken = TOKENS[toIdx];
  const parsed = parseFloat(inputAmount);
  const isValid = !isNaN(parsed) && parsed > 0;

  const swapResult = useMemo(() => {
    if (!isValid) return null;
    return simulateSwap(fromToken.symbol, toToken.symbol, parsed);
  }, [parsed, isValid, fromToken.symbol, toToken.symbol]);

  const minReceived = swapResult ? swapResult.amountOut * (1 - slippage / 100) : 0;

  const flipTokens = () => {
    setFromIdx(toIdx);
    setToIdx(fromIdx);
    setInputAmount("");
  };

  const selectFrom = (idx: number) => {
    if (idx === toIdx) setToIdx(fromIdx);
    setFromIdx(idx);
    setShowFromSelect(false);
    setInputAmount("");
  };

  const selectTo = (idx: number) => {
    if (idx === fromIdx) setFromIdx(toIdx);
    setToIdx(idx);
    setShowToSelect(false);
    setInputAmount("");
  };

  const handleCustomSlippage = (val: string) => {
    setCustomSlippage(val);
    const p = parseFloat(val);
    if (!isNaN(p) && p > 0 && p <= 50) setSlippage(p);
  };

  const handleSwap = async () => {
    if (!isValid || !address || !swapResult) return;
    setIsSwapping(true);

    // Simulate contract interaction delay
    await new Promise((r) => setTimeout(r, 1500));

    const newTx: SwapTx = {
      id: `0x${Math.random().toString(16).slice(2, 10)}`,
      from: fromToken.symbol,
      to: toToken.symbol,
      amountIn: parsed,
      amountOut: swapResult.amountOut,
      fee: swapResult.fee,
      date: new Date(),
      status: "completed",
    };
    setTxHistory((prev) => [newTx, ...prev]);
    setInputAmount("");
    setIsSwapping(false);

    toast({
      title: "Swap Executed",
      description: `${parsed.toLocaleString()} ${fromToken.symbol} → ${swapResult.amountOut.toFixed(4)} ${toToken.symbol} | Fee: ${swapResult.fee.toFixed(6)}`,
    });
  };

  const TokenSelector = ({
    current,
    show,
    setShow,
    onSelect,
    label,
  }: {
    current: typeof TOKENS[0];
    show: boolean;
    setShow: (v: boolean) => void;
    onSelect: (i: number) => void;
    label: string;
  }) => (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className={`flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-3 py-2.5 transition-colors hover:bg-muted/60 ${current.color}`}
      >
        <img src={current.logo} alt="" className={`h-6 w-6 rounded-full ${current.anim}`} />
        <span className="text-sm font-bold">{current.symbol}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-1.5 shadow-xl"
          >
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            {TOKENS.map((t, i) => (
              <button
                key={t.symbol}
                onClick={() => onSelect(i)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted/50 ${t.symbol === current.symbol ? "bg-muted/30" : ""}`}
              >
                <img src={t.logo} alt="" className={`h-5 w-5 rounded-full ${t.anim}`} />
                <span className="font-medium">{t.symbol}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pointer-events-none fixed inset-0 z-0"><EmberParticles /></div>

      <main className="relative z-10 container mx-auto px-4 pb-20 pt-28">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <Link to="/twinflame-lending" className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Landmark className="h-4 w-4" /> Lending & Borrowing
          </Link>
        </div>

        <div className="mx-auto max-w-xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-2 flex items-center gap-3">
              <Flame className="h-8 w-8 text-blaze animate-blaze-burn" />
              <h1 className="font-display text-3xl font-bold text-gradient-fire">TwinFlame Swap</h1>
            </div>
            <p className="mb-2 text-muted-foreground">Polygon DeFi swap with built-in burn mechanics & revenue sharing.</p>
            <div className="mb-8 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-muted-foreground">
                <Shield className="mr-1 inline h-3 w-3" /> 0.3% Protocol Fee
              </span>
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-muted-foreground">
                <Flame className="mr-1 inline h-3 w-3" /> 50% Fee → Burn
              </span>
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-muted-foreground">
                <TrendingUp className="mr-1 inline h-3 w-3" /> 30% → Rewards
              </span>
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-muted-foreground">
                <Wallet className="mr-1 inline h-3 w-3" /> 20% → EQT Dividends
              </span>
            </div>
          </motion.div>

          {/* Swap Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/60 bg-card glow-fire">
              <CardContent className="space-y-4 p-6">
                {/* Settings */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Slippage: {slippage}%</span>
                  <div className="flex items-center gap-2">
                    {address && (
                      <span className="rounded-md border border-border/50 bg-muted/30 px-2.5 py-1 text-xs font-mono text-muted-foreground">
                        {shortAddress}
                      </span>
                    )}
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Settings2 className="h-3.5 w-3.5" /> Settings
                    </button>
                  </div>
                </div>

                {/* Slippage Settings */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="rounded-lg border border-border/40 bg-muted/20 p-4 space-y-3">
                        <p className="text-xs font-medium text-foreground">Slippage Tolerance</p>
                        <div className="flex items-center gap-2">
                          {SLIPPAGE_OPTS.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => { setSlippage(opt); setCustomSlippage(""); }}
                              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
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
                        {slippage > 5 && <p className="text-xs text-destructive">⚠ High slippage increases execution risk.</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* From Token */}
                <div className={`rounded-lg border ${fromToken.border} ${fromToken.bg} p-4`}>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">You send</label>
                  <div className="flex items-center gap-3">
                    <TokenSelector current={fromToken} show={showFromSelect} setShow={setShowFromSelect} onSelect={selectFrom} label="Select token" />
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
                    className="rounded-full border border-border bg-muted p-2.5 text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  >
                    <ArrowDownUp className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* To Token */}
                <div className={`rounded-lg border ${toToken.border} ${toToken.bg} p-4`}>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">You receive</label>
                  <div className="flex items-center gap-3">
                    <TokenSelector current={toToken} show={showToSelect} setShow={setShowToSelect} onSelect={selectTo} label="Select token" />
                    <div className="flex-1 text-right text-xl font-semibold text-foreground">
                      {swapResult ? swapResult.amountOut.toFixed(4) : "0.00"}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <AnimatePresence>
                  {isValid && swapResult && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="space-y-2 rounded-lg border border-border/40 bg-muted/30 p-3 text-sm">
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
                        <div className="flex justify-between text-muted-foreground">
                          <span>Slippage</span>
                          <span>{slippage}%</span>
                        </div>
                        <div className="flex justify-between font-medium text-foreground border-t border-border/30 pt-2">
                          <span>Min. Received</span>
                          <span>{minReceived.toFixed(4)} {toToken.symbol}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Contract Info */}
                <div className="flex items-center justify-between rounded-md border border-border/30 bg-muted/10 px-3 py-1.5">
                  <span className="text-[10px] text-muted-foreground">Router: {CONTRACTS.TWINFLAME_SWAP.slice(0, 10)}…</span>
                  <a href={`https://polygonscan.com/address/${CONTRACTS.TWINFLAME_SWAP}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    Polygonscan <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>

                {/* Action */}
                {!address ? (
                  <Button onClick={connect} disabled={isConnecting} className="w-full bg-gradient-fire text-primary-foreground hover:opacity-90" size="lg">
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
                      <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Executing Swap…</span>
                    ) : !isValid ? "Enter an amount" : `Swap ${fromToken.symbol} → ${toToken.symbol}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Transaction History */}
          {txHistory.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="mt-6 border-border/40 bg-card/80">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-muted-foreground" /> Swap History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {txHistory.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between border-b border-border/20 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <ArrowDownUp className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{tx.from} → {tx.to}</p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {timeAgo(tx.date)}
                              <span className="ml-1 font-mono text-[10px] text-muted-foreground/60">{tx.id}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{tx.amountOut.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tx.to}</p>
                          <p className="flex items-center justify-end gap-0.5 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-green-400" /> {tx.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Fee Breakdown Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Flame, title: "Buyback & Burn", desc: "50% of all swap fees buy back BLAZE and permanently burn it, reducing supply.", color: "text-blaze" },
              { icon: Zap, title: "Staker Rewards", desc: "30% of fees purchase EMBER distributed to BLAZE stakers as yield.", color: "text-ember" },
              { icon: TrendingUp, title: "EQT Dividends", desc: "20% flows to the EQT dividend pool, paid quarterly in stablecoins.", color: "text-equity" },
            ].map((c, i) => (
              <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.1 }}>
                <Card className="border-border/40 bg-card/60 h-full">
                  <CardContent className="p-4">
                    <c.icon className={`mb-2 h-5 w-5 ${c.color}`} />
                    <h3 className="mb-1 text-sm font-semibold text-foreground">{c.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TwinFlameSwap;
