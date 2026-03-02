import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownUp, ArrowLeft, Zap, TrendingUp, Shield, Settings2, Clock, Check } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";

type Direction = "blazeToEmber" | "emberToBlaze";

const BLAZE_TO_EMBER_RATE = 1.05;
const EMBER_TO_BLAZE_RATE = 0.9;
const PROTOCOL_FEE = 0.003;
const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0];

const TOKEN_META = {
  blaze: { name: "BLAZE", logo: TOKEN_LOGOS.BLAZE, color: "text-blaze", bg: "bg-blaze/10", border: "border-blaze/30", animClass: "animate-blaze-burn" },
  ember: { name: "EMBER", logo: TOKEN_LOGOS.EMBER, color: "text-ember", bg: "bg-ember/10", border: "border-ember/30", animClass: "animate-ember-float" },
};

interface SwapTx {
  id: string;
  from: string;
  to: string;
  amountIn: number;
  amountOut: number;
  date: Date;
  status: "completed" | "pending";
}

const MOCK_HISTORY: SwapTx[] = [
  { id: "0xa1b2", from: "BLAZE", to: "EMBER", amountIn: 500, amountOut: 523.43, date: new Date(Date.now() - 3600000 * 2), status: "completed" },
  { id: "0xc3d4", from: "EMBER", to: "BLAZE", amountIn: 1200, amountOut: 1076.76, date: new Date(Date.now() - 3600000 * 18), status: "completed" },
  { id: "0xe5f6", from: "BLAZE", to: "EMBER", amountIn: 250, amountOut: 261.71, date: new Date(Date.now() - 86400000 * 2), status: "completed" },
  { id: "0x7890", from: "EMBER", to: "BLAZE", amountIn: 3000, amountOut: 2691.9, date: new Date(Date.now() - 86400000 * 5), status: "completed" },
];

const timeAgo = (d: Date) => {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Swap = () => {
  const { address, connect, isConnecting } = useWallet();
  const { toast } = useToast();
  const [direction, setDirection] = useState<Direction>("blazeToEmber");
  const [inputAmount, setInputAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [txHistory, setTxHistory] = useState<SwapTx[]>(MOCK_HISTORY);

  const fromToken = direction === "blazeToEmber" ? TOKEN_META.blaze : TOKEN_META.ember;
  const toToken = direction === "blazeToEmber" ? TOKEN_META.ember : TOKEN_META.blaze;
  const rate = direction === "blazeToEmber" ? BLAZE_TO_EMBER_RATE : EMBER_TO_BLAZE_RATE;

  const parsed = parseFloat(inputAmount);
  const isValid = !isNaN(parsed) && parsed > 0;

  const { outputAmount, feeAmount, effectiveRate, minReceived } = useMemo(() => {
    if (!isValid) return { outputAmount: 0, feeAmount: 0, effectiveRate: rate, minReceived: 0 };
    const gross = parsed * rate;
    const fee = gross * PROTOCOL_FEE;
    const out = gross - fee;
    return { outputAmount: out, feeAmount: fee, effectiveRate: rate * (1 - PROTOCOL_FEE), minReceived: out * (1 - slippage / 100) };
  }, [parsed, isValid, rate, slippage]);

  const flipDirection = () => {
    setDirection((d) => (d === "blazeToEmber" ? "emberToBlaze" : "blazeToEmber"));
    setInputAmount("");
  };

  const handleCustomSlippage = (val: string) => {
    setCustomSlippage(val);
    const p = parseFloat(val);
    if (!isNaN(p) && p > 0 && p <= 50) setSlippage(p);
  };

  const handleSwap = () => {
    if (!isValid || !address) return;
    const newTx: SwapTx = {
      id: `0x${Math.random().toString(16).slice(2, 6)}`,
      from: fromToken.name,
      to: toToken.name,
      amountIn: parsed,
      amountOut: outputAmount,
      date: new Date(),
      status: "completed",
    };
    setTxHistory((prev) => [newTx, ...prev]);
    setInputAmount("");
    toast({
      title: "Swap Successful",
      description: `Swapped ${parsed.toLocaleString()} ${fromToken.name} → ${outputAmount.toFixed(4)} ${toToken.name}`,
    });
  };

  const infoCards = [
    { icon: Zap, title: "Burn-to-Mint", desc: "Tokens are burned on one side and minted on the other—no liquidity pool needed." },
    { icon: TrendingUp, title: "Fixed Rates", desc: "BLAZE→EMBER at 5% premium, EMBER→BLAZE at 10% discount. Rates are protocol-defined." },
    { icon: Shield, title: "0.3% Fee", desc: "Protocol fee funds buyback-and-burn (50%), EMBER rewards (30%), and EQT dividends (20%)." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pb-20 pt-28">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-lg">
          <h1 className="mb-2 font-display text-3xl font-bold text-gradient-fire">Token Swap</h1>
          <p className="mb-8 text-muted-foreground">Convert between BLAZE and EMBER using the dual-conversion mechanism.</p>

          {/* Swap Card */}
          <Card className="border-border/60 bg-card glow-fire">
            <CardContent className="space-y-4 p-6">
              {/* Settings Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Slippage: {slippage}%</span>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Settings
                </button>
              </div>

              {/* Slippage Settings */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-lg border border-border/40 bg-muted/20 p-4 space-y-3">
                      <p className="text-xs font-medium text-foreground">Slippage Tolerance</p>
                      <div className="flex items-center gap-2">
                        {SLIPPAGE_OPTIONS.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => { setSlippage(opt); setCustomSlippage(""); }}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                              slippage === opt && !customSlippage
                                ? "bg-primary text-primary-foreground"
                                : "border border-border/50 bg-background/60 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {opt}%
                          </button>
                        ))}
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            min="0.01"
                            max="50"
                            step="0.1"
                            placeholder="Custom"
                            value={customSlippage}
                            onChange={(e) => handleCustomSlippage(e.target.value)}
                            className="h-8 border-border/50 bg-background/60 pr-6 text-xs"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                        </div>
                      </div>
                      {slippage > 5 && (
                        <p className="text-xs text-destructive">⚠ High slippage increases risk of unfavorable execution.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* From */}
              <div className={`rounded-lg border ${fromToken.border} ${fromToken.bg} p-4`}>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">You send</label>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 rounded-md border border-border/50 bg-background/60 px-3 py-2 ${fromToken.color}`}>
                    <img src={fromToken.logo} alt="" className={`h-4 w-4 rounded-full ${fromToken.animClass}`} />
                    <span className="text-sm font-semibold">{fromToken.name}</span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    className="border-none bg-transparent text-right text-xl font-semibold focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* Flip Button */}
              <div className="flex justify-center -my-2 relative z-10">
                <button
                  onClick={flipDirection}
                  className="rounded-full border border-border bg-muted p-2.5 text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary"
                >
                  <ArrowDownUp className="h-4 w-4" />
                </button>
              </div>

              {/* To */}
              <div className={`rounded-lg border ${toToken.border} ${toToken.bg} p-4`}>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">You receive</label>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 rounded-md border border-border/50 bg-background/60 px-3 py-2 ${toToken.color}`}>
                    <img src={toToken.logo} alt="" className={`h-4 w-4 rounded-full ${toToken.animClass}`} />
                    <span className="text-sm font-semibold">{toToken.name}</span>
                  </div>
                  <div className="flex-1 text-right text-xl font-semibold text-foreground">
                    {isValid ? outputAmount.toFixed(4) : "0.00"}
                  </div>
                </div>
              </div>

              {/* Details */}
              <AnimatePresence>
                {isValid && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 rounded-lg border border-border/40 bg-muted/30 p-3 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Rate</span>
                        <span>1 {fromToken.name} = {rate.toFixed(4)} {toToken.name}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Protocol Fee (0.3%)</span>
                        <span>{feeAmount.toFixed(6)} {toToken.name}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Slippage Tolerance</span>
                        <span>{slippage}%</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Min. Received</span>
                        <span>{minReceived.toFixed(4)} {toToken.name}</span>
                      </div>
                      <div className="flex justify-between font-medium text-foreground">
                        <span>Effective Rate</span>
                        <span>1 {fromToken.name} = {effectiveRate.toFixed(4)} {toToken.name}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action */}
              {!address ? (
                <Button
                  onClick={connect}
                  disabled={isConnecting}
                  className="w-full bg-gradient-fire text-primary-foreground hover:opacity-90"
                  size="lg"
                >
                  {isConnecting ? "Connecting…" : "Connect Wallet to Swap"}
                </Button>
              ) : (
                <Button
                  disabled={!isValid}
                  onClick={handleSwap}
                  className="w-full bg-gradient-fire text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  size="lg"
                >
                  {!isValid ? "Enter an amount" : `Swap ${fromToken.name} → ${toToken.name}`}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="mt-6 border-border/40 bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {txHistory.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No transactions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {txHistory.map((tx) => (
                      <div key={tx.id + tx.date.getTime()} className="flex items-center justify-between border-b border-border/20 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <ArrowDownUp className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {tx.from} → {tx.to}
                            </p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {timeAgo(tx.date)}
                              <span className="ml-1 text-[10px] text-muted-foreground/60">{tx.id}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {tx.amountOut.toLocaleString(undefined, { maximumFractionDigits: 2 })} {tx.to}
                          </p>
                          <p className="flex items-center justify-end gap-0.5 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-green-400" />
                            {tx.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {infoCards.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <Card className="border-border/40 bg-card/60 h-full">
                  <CardContent className="p-4">
                    <c.icon className="mb-2 h-5 w-5 text-primary" />
                    <h3 className="mb-1 text-sm font-semibold text-foreground">{c.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Swap;
