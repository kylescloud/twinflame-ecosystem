import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDownUp, Flame, Sparkles, Info, ArrowLeft, Zap, TrendingUp, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Direction = "blazeToEmber" | "emberToBlaze";

const BLAZE_TO_EMBER_RATE = 1.05; // 5% premium: 1 BLAZE → 1.05 EMBER
const EMBER_TO_BLAZE_RATE = 0.9;  // 10% discount: ~1.11 EMBER → 1 BLAZE
const PROTOCOL_FEE = 0.003;

const TOKEN_META = {
  blaze: { name: "BLAZE", icon: Flame, color: "text-blaze", bg: "bg-blaze/10", border: "border-blaze/30" },
  ember: { name: "EMBER", icon: Sparkles, color: "text-ember", bg: "bg-ember/10", border: "border-ember/30" },
};

const Swap = () => {
  const { address, connect, isConnecting, hasWallet } = useWallet();
  const [direction, setDirection] = useState<Direction>("blazeToEmber");
  const [inputAmount, setInputAmount] = useState("");

  const fromToken = direction === "blazeToEmber" ? TOKEN_META.blaze : TOKEN_META.ember;
  const toToken = direction === "blazeToEmber" ? TOKEN_META.ember : TOKEN_META.blaze;
  const rate = direction === "blazeToEmber" ? BLAZE_TO_EMBER_RATE : EMBER_TO_BLAZE_RATE;

  const parsed = parseFloat(inputAmount);
  const isValid = !isNaN(parsed) && parsed > 0;

  const { outputAmount, feeAmount, effectiveRate } = useMemo(() => {
    if (!isValid) return { outputAmount: 0, feeAmount: 0, effectiveRate: rate };
    const gross = parsed * rate;
    const fee = gross * PROTOCOL_FEE;
    return { outputAmount: gross - fee, feeAmount: fee, effectiveRate: rate * (1 - PROTOCOL_FEE) };
  }, [parsed, isValid, rate]);

  const flipDirection = () => {
    setDirection((d) => (d === "blazeToEmber" ? "emberToBlaze" : "blazeToEmber"));
    setInputAmount("");
  };

  const infoCards = [
    {
      icon: Zap,
      title: "Burn-to-Mint",
      desc: "Tokens are burned on one side and minted on the other—no liquidity pool needed.",
    },
    {
      icon: TrendingUp,
      title: "Fixed Rates",
      desc: "BLAZE→EMBER at 5% premium, EMBER→BLAZE at 10% discount. Rates are protocol-defined.",
    },
    {
      icon: Shield,
      title: "0.3% Fee",
      desc: "Protocol fee funds buyback-and-burn (50%), EMBER rewards (30%), and EQT dividends (20%).",
    },
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
              {/* From */}
              <div className={`rounded-lg border ${fromToken.border} ${fromToken.bg} p-4`}>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">You send</label>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 rounded-md border border-border/50 bg-background/60 px-3 py-2 ${fromToken.color}`}>
                    <fromToken.icon className="h-4 w-4" />
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
                    <toToken.icon className="h-4 w-4" />
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
                  {isConnecting ? "Connecting…" : hasWallet ? "Connect Wallet to Swap" : "Install MetaMask"}
                </Button>
              ) : (
                <Button
                  disabled={!isValid}
                  className="w-full bg-gradient-fire text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  size="lg"
                >
                  {!isValid ? "Enter an amount" : `Swap ${fromToken.name} → ${toToken.name}`}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
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
