import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Landmark, Users, Shield, TrendingUp, Clock, Check, AlertTriangle,
  Plus, ChevronDown, ExternalLink, Wallet, Flame, DollarSign, Percent,
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
import { CONTRACTS, FEE_CONFIG, LENDING_CONFIG } from "@/lib/contracts";
import EmberParticles from "@/components/EmberParticles";

const TOKENS = [
  { symbol: "BLAZE", logo: TOKEN_LOGOS.BLAZE, color: "text-blaze", bg: "bg-blaze/10", border: "border-blaze/30", anim: "animate-blaze-burn" },
  { symbol: "EMBER", logo: TOKEN_LOGOS.EMBER, color: "text-ember", bg: "bg-ember/10", border: "border-ember/30", anim: "animate-ember-float" },
];

// Simulated pool data
const POOL_DATA = {
  BLAZE: { totalDeposits: 2450000, totalBorrowed: 1127000, supplyAPY: 4.2, borrowAPY: 8.5, utilization: 46 },
  EMBER: { totalDeposits: 8920000, totalBorrowed: 3568000, supplyAPY: 5.8, borrowAPY: 11.2, utilization: 40 },
};

interface LoanOffer {
  id: string; lender: string; token: string; amount: number; interestRate: number;
  duration: number; collateralToken: string; minCollateral: number; active: boolean;
}

interface ActiveLoan {
  id: string; type: "pool" | "p2p"; borrower: string; token: string; amount: number;
  collateralToken: string; collateralAmount: number; interestRate: number;
  dueDate: Date; status: "active" | "repaid" | "liquidated";
}

const MOCK_OFFERS: LoanOffer[] = [
  { id: "0x001", lender: "0x7a3b...f1e2", token: "BLAZE", amount: 5000, interestRate: 6.5, duration: 30, collateralToken: "EMBER", minCollateral: 7500, active: true },
  { id: "0x002", lender: "0x9c4d...a3b1", token: "EMBER", amount: 15000, interestRate: 8.0, duration: 14, collateralToken: "BLAZE", minCollateral: 10000, active: true },
  { id: "0x003", lender: "0x2e5f...c8d9", token: "BLAZE", amount: 25000, interestRate: 5.5, duration: 60, collateralToken: "EMBER", minCollateral: 37500, active: true },
  { id: "0x004", lender: "0x1b8a...e7f3", token: "EMBER", amount: 50000, interestRate: 7.2, duration: 90, collateralToken: "BLAZE", minCollateral: 35000, active: true },
];

const TwinFlameLending = () => {
  const { address, connect, isConnecting, shortAddress } = useWallet();
  const { toast } = useToast();

  // Pool state
  const [poolAction, setPoolAction] = useState<"deposit" | "withdraw" | "borrow" | "repay">("deposit");
  const [poolTokenIdx, setPoolTokenIdx] = useState(0);
  const [poolAmount, setPoolAmount] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");

  // P2P state
  const [p2pAction, setP2pAction] = useState<"browse" | "create">("browse");
  const [offerToken, setOfferToken] = useState(0);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerRate, setOfferRate] = useState("");
  const [offerDuration, setOfferDuration] = useState("");
  const [offerCollateralToken, setOfferCollateralToken] = useState(1);
  const [offerMinCollateral, setOfferMinCollateral] = useState("");
  const [loanOffers, setLoanOffers] = useState<LoanOffer[]>(MOCK_OFFERS);
  const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const poolToken = TOKENS[poolTokenIdx];
  const pool = POOL_DATA[poolToken.symbol as keyof typeof POOL_DATA];
  const parsedPoolAmt = parseFloat(poolAmount);
  const isPoolValid = !isNaN(parsedPoolAmt) && parsedPoolAmt > 0;

  const requiredCollateral = useMemo(() => {
    if (!isPoolValid || poolAction !== "borrow") return 0;
    return parsedPoolAmt * (LENDING_CONFIG.MIN_COLLATERAL_RATIO / 100);
  }, [parsedPoolAmt, isPoolValid, poolAction]);

  const handlePoolAction = async () => {
    if (!isPoolValid || !address) return;
    setIsExecuting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsExecuting(false);
    setPoolAmount("");
    setCollateralAmount("");

    if (poolAction === "borrow") {
      const loan: ActiveLoan = {
        id: `0x${Math.random().toString(16).slice(2, 8)}`,
        type: "pool",
        borrower: address,
        token: poolToken.symbol,
        amount: parsedPoolAmt,
        collateralToken: TOKENS[poolTokenIdx === 0 ? 1 : 0].symbol,
        collateralAmount: requiredCollateral,
        interestRate: pool.borrowAPY,
        dueDate: new Date(Date.now() + 30 * 86400000),
        status: "active",
      };
      setActiveLoans((prev) => [loan, ...prev]);
    }

    const actionText = { deposit: "Deposited", withdraw: "Withdrawn", borrow: "Borrowed", repay: "Repaid" }[poolAction];
    toast({
      title: `${actionText} Successfully`,
      description: `${parsedPoolAmt.toLocaleString()} ${poolToken.symbol} | Fee: ${(parsedPoolAmt * FEE_CONFIG.PROTOCOL_FEE_BPS / 10000).toFixed(4)}`,
    });
  };

  const handleFillOffer = async (offer: LoanOffer) => {
    if (!address) return;
    setIsExecuting(true);
    await new Promise((r) => setTimeout(r, 1500));

    const loan: ActiveLoan = {
      id: `0x${Math.random().toString(16).slice(2, 8)}`,
      type: "p2p",
      borrower: address,
      token: offer.token,
      amount: offer.amount,
      collateralToken: offer.collateralToken,
      collateralAmount: offer.minCollateral,
      interestRate: offer.interestRate,
      dueDate: new Date(Date.now() + offer.duration * 86400000),
      status: "active",
    };
    setActiveLoans((prev) => [loan, ...prev]);
    setLoanOffers((prev) => prev.filter((o) => o.id !== offer.id));
    setIsExecuting(false);

    toast({ title: "Loan Filled", description: `Borrowed ${offer.amount.toLocaleString()} ${offer.token} at ${offer.interestRate}% APR` });
  };

  const handleCreateOffer = async () => {
    if (!address) return;
    const amt = parseFloat(offerAmount);
    const rate = parseFloat(offerRate);
    const dur = parseInt(offerDuration);
    const minCol = parseFloat(offerMinCollateral);
    if ([amt, rate, dur, minCol].some((v) => isNaN(v) || v <= 0)) return;

    setIsExecuting(true);
    await new Promise((r) => setTimeout(r, 1500));

    const newOffer: LoanOffer = {
      id: `0x${Math.random().toString(16).slice(2, 8)}`,
      lender: `${address.slice(0, 6)}...${address.slice(-4)}`,
      token: TOKENS[offerToken].symbol,
      amount: amt,
      interestRate: rate,
      duration: dur,
      collateralToken: TOKENS[offerCollateralToken].symbol,
      minCollateral: minCol,
      active: true,
    };
    setLoanOffers((prev) => [newOffer, ...prev]);
    setOfferAmount(""); setOfferRate(""); setOfferDuration(""); setOfferMinCollateral("");
    setIsExecuting(false);

    toast({ title: "Loan Offer Created", description: `${amt.toLocaleString()} ${TOKENS[offerToken].symbol} at ${rate}% APR for ${dur} days` });
  };

  const handleRepay = async (loan: ActiveLoan) => {
    setIsExecuting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setActiveLoans((prev) => prev.map((l) => l.id === loan.id ? { ...l, status: "repaid" as const } : l));
    setIsExecuting(false);
    toast({ title: "Loan Repaid", description: `${loan.amount.toLocaleString()} ${loan.token} returned + interest` });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pointer-events-none fixed inset-0 z-0"><EmberParticles /></div>

      <main className="relative z-10 container mx-auto px-4 pb-20 pt-28">
        <Link to="/twinflame-swap" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Swap
        </Link>

        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="mb-2 flex items-center gap-3">
              <Landmark className="h-8 w-8 text-ember animate-ember-float" />
              <h1 className="font-display text-3xl font-bold text-gradient-fire">TwinFlame Lending</h1>
            </div>
            <p className="text-muted-foreground">Lend & borrow BLAZE and EMBER. Pool-based or peer-to-peer — you choose.</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-muted-foreground">
                <Shield className="mr-1 inline h-3 w-3" /> {LENDING_CONFIG.MIN_COLLATERAL_RATIO}% Collateral Ratio
              </span>
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-muted-foreground">
                <Percent className="mr-1 inline h-3 w-3" /> 0.3% Protocol Fee
              </span>
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-muted-foreground">
                <AlertTriangle className="mr-1 inline h-3 w-3" /> Liquidation at {LENDING_CONFIG.LIQUIDATION_THRESHOLD}%
              </span>
            </div>
          </motion.div>

          {/* Pool Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6 grid gap-4 sm:grid-cols-2">
            {TOKENS.map((t) => {
              const p = POOL_DATA[t.symbol as keyof typeof POOL_DATA];
              return (
                <Card key={t.symbol} className={`border ${t.border} ${t.bg}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <img src={t.logo} alt="" className={`h-6 w-6 rounded-full ${t.anim}`} />
                      <span className={`font-bold ${t.color}`}>{t.symbol} Pool</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div><span className="text-muted-foreground text-xs">Total Deposits</span><p className="font-semibold">{(p.totalDeposits / 1e6).toFixed(2)}M</p></div>
                      <div><span className="text-muted-foreground text-xs">Total Borrowed</span><p className="font-semibold">{(p.totalBorrowed / 1e6).toFixed(2)}M</p></div>
                      <div><span className="text-muted-foreground text-xs">Supply APY</span><p className="font-semibold text-green-400">{p.supplyAPY}%</p></div>
                      <div><span className="text-muted-foreground text-xs">Borrow APY</span><p className="font-semibold text-amber-400">{p.borrowAPY}%</p></div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Utilization</span><span>{p.utilization}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-fire" style={{ width: `${p.utilization}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>

          {/* Main Tabs */}
          <Tabs defaultValue="pool" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-muted/30">
              <TabsTrigger value="pool" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Landmark className="mr-1.5 h-3.5 w-3.5" /> Pool Lending
              </TabsTrigger>
              <TabsTrigger value="p2p" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="mr-1.5 h-3.5 w-3.5" /> P2P Lending
              </TabsTrigger>
              <TabsTrigger value="loans" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Clock className="mr-1.5 h-3.5 w-3.5" /> My Loans {activeLoans.length > 0 && `(${activeLoans.length})`}
              </TabsTrigger>
            </TabsList>

            {/* Pool Tab */}
            <TabsContent value="pool">
              <Card className="border-border/60 bg-card glow-fire">
                <CardContent className="p-6 space-y-4">
                  {/* Pool Action Tabs */}
                  <div className="flex gap-1 rounded-lg border border-border/40 bg-muted/20 p-1">
                    {(["deposit", "withdraw", "borrow", "repay"] as const).map((a) => (
                      <button
                        key={a}
                        onClick={() => setPoolAction(a)}
                        className={`flex-1 rounded-md px-3 py-2 text-xs font-medium capitalize transition-all ${
                          poolAction === a ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>

                  {/* Token Select */}
                  <div className="flex gap-2">
                    {TOKENS.map((t, i) => (
                      <button
                        key={t.symbol}
                        onClick={() => setPoolTokenIdx(i)}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 transition-all ${
                          poolTokenIdx === i ? `${t.border} ${t.bg} ${t.color}` : "border-border/40 text-muted-foreground hover:border-border"
                        }`}
                      >
                        <img src={t.logo} alt="" className={`h-5 w-5 rounded-full ${t.anim}`} />
                        <span className="text-sm font-semibold">{t.symbol}</span>
                      </button>
                    ))}
                  </div>

                  {/* Amount Input */}
                  <div className={`rounded-lg border ${poolToken.border} ${poolToken.bg} p-4`}>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {poolAction === "deposit" ? "Amount to Deposit" : poolAction === "withdraw" ? "Amount to Withdraw" : poolAction === "borrow" ? "Amount to Borrow" : "Loan ID to Repay"}
                    </label>
                    <Input
                      type="number" min="0" step="any" placeholder="0.00"
                      value={poolAmount} onChange={(e) => setPoolAmount(e.target.value)}
                      className="border-none bg-transparent text-xl font-semibold focus-visible:ring-0"
                    />
                  </div>

                  {/* Collateral for Borrow */}
                  {poolAction === "borrow" && isPoolValid && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                      <div className="rounded-lg border border-border/40 bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <img src={TOKENS[poolTokenIdx === 0 ? 1 : 0].logo} alt="" className="h-5 w-5 rounded-full" />
                          <span className="text-sm font-medium">Collateral: {TOKENS[poolTokenIdx === 0 ? 1 : 0].symbol}</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Required Collateral (150%)</span>
                            <span className="font-medium text-foreground">{requiredCollateral.toLocaleString()} {TOKENS[poolTokenIdx === 0 ? 1 : 0].symbol}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Liquidation Threshold</span>
                            <span>{LENDING_CONFIG.LIQUIDATION_THRESHOLD}%</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Borrow APY</span>
                            <span className="text-amber-400">{pool.borrowAPY}%</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Protocol Fee</span>
                            <span>{(parsedPoolAmt * FEE_CONFIG.PROTOCOL_FEE_BPS / 10000).toFixed(4)} {poolToken.symbol}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Pool Details */}
                  {isPoolValid && poolAction !== "borrow" && (
                    <div className="space-y-2 rounded-lg border border-border/40 bg-muted/30 p-3 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>{poolAction === "deposit" ? "Supply APY" : "Current Rate"}</span>
                        <span className="text-green-400">{poolAction === "deposit" ? pool.supplyAPY : pool.borrowAPY}%</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Protocol Fee (0.3%)</span>
                        <span>{(parsedPoolAmt * FEE_CONFIG.PROTOCOL_FEE_BPS / 10000).toFixed(4)} {poolToken.symbol}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Pool Utilization</span>
                        <span>{pool.utilization}%</span>
                      </div>
                    </div>
                  )}

                  {/* Contract */}
                  <div className="flex items-center justify-between rounded-md border border-border/30 bg-muted/10 px-3 py-1.5">
                    <span className="text-[10px] text-muted-foreground">Lending Pool: {CONTRACTS.TWINFLAME_LENDING.slice(0, 10)}…</span>
                    <a href={`https://polygonscan.com/address/${CONTRACTS.TWINFLAME_LENDING}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                      Polygonscan <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>

                  {!address ? (
                    <Button onClick={connect} disabled={isConnecting} className="w-full bg-gradient-fire text-primary-foreground hover:opacity-90" size="lg">
                      {isConnecting ? "Connecting…" : "Connect Wallet"}
                    </Button>
                  ) : (
                    <Button
                      disabled={!isPoolValid || isExecuting}
                      onClick={handlePoolAction}
                      className="w-full bg-gradient-fire text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      size="lg"
                    >
                      {isExecuting ? (
                        <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Processing…</span>
                      ) : !isPoolValid ? "Enter an amount" : `${poolAction.charAt(0).toUpperCase() + poolAction.slice(1)} ${poolToken.symbol}`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* P2P Tab */}
            <TabsContent value="p2p">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={p2pAction === "browse" ? "default" : "outline"} onClick={() => setP2pAction("browse")} size="sm" className={p2pAction === "browse" ? "bg-gradient-fire text-primary-foreground" : ""}>
                    Browse Offers
                  </Button>
                  <Button variant={p2pAction === "create" ? "default" : "outline"} onClick={() => setP2pAction("create")} size="sm" className={p2pAction === "create" ? "bg-gradient-fire text-primary-foreground" : ""}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Create Offer
                  </Button>
                </div>

                {p2pAction === "browse" ? (
                  <div className="space-y-3">
                    {loanOffers.filter((o) => o.active).map((offer) => (
                      <Card key={offer.id} className="border-border/40 bg-card/80">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <img src={TOKEN_LOGOS[offer.token as keyof typeof TOKEN_LOGOS]} alt="" className="h-5 w-5 rounded-full" />
                                <span className="font-semibold">{offer.amount.toLocaleString()} {offer.token}</span>
                                <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">P2P</span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span><Percent className="mr-0.5 inline h-3 w-3" /> {offer.interestRate}% APR</span>
                                <span><Clock className="mr-0.5 inline h-3 w-3" /> {offer.duration} days</span>
                                <span><Shield className="mr-0.5 inline h-3 w-3" /> Min {offer.minCollateral.toLocaleString()} {offer.collateralToken}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground/60 font-mono">Lender: {offer.lender}</p>
                            </div>
                            {address ? (
                              <Button size="sm" onClick={() => handleFillOffer(offer)} disabled={isExecuting} className="bg-gradient-fire text-primary-foreground hover:opacity-90">
                                Borrow
                              </Button>
                            ) : (
                              <Button size="sm" onClick={connect} variant="outline">Connect</Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {loanOffers.filter((o) => o.active).length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">No active loan offers. Be the first to create one!</p>
                    )}
                  </div>
                ) : (
                  <Card className="border-border/60 bg-card">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-sm font-semibold text-foreground">Create a Loan Offer</h3>
                      <p className="text-xs text-muted-foreground">Lend your tokens to other users at your chosen interest rate.</p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Lending Token</label>
                          <div className="flex gap-2">
                            {TOKENS.map((t, i) => (
                              <button key={t.symbol} onClick={() => { setOfferToken(i); setOfferCollateralToken(i === 0 ? 1 : 0); }}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ${offerToken === i ? `${t.border} ${t.bg} ${t.color}` : "border-border/40 text-muted-foreground"}`}>
                                <img src={t.logo} alt="" className={`h-4 w-4 rounded-full ${t.anim}`} />
                                <span className="text-sm font-semibold">{t.symbol}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Amount</label>
                          <Input type="number" min="0" step="any" placeholder="0.00" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Interest Rate (APR %)</label>
                          <Input type="number" min="0.1" step="0.1" placeholder="5.0" value={offerRate} onChange={(e) => setOfferRate(e.target.value)} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Duration (Days)</label>
                          <Input type="number" min="1" max="365" step="1" placeholder="30" value={offerDuration} onChange={(e) => setOfferDuration(e.target.value)} />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Collateral Token</label>
                          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                            <img src={TOKENS[offerCollateralToken].logo} alt="" className="h-4 w-4 rounded-full" />
                            <span className="text-sm font-medium">{TOKENS[offerCollateralToken].symbol}</span>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Min. Collateral Required</label>
                          <Input type="number" min="0" step="any" placeholder="0.00" value={offerMinCollateral} onChange={(e) => setOfferMinCollateral(e.target.value)} />
                        </div>
                      </div>

                      <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
                        <p>• Protocol charges 0.3% fee on the loan amount</p>
                        <p>• Fee split: 50% burn, 30% staker rewards, 20% EQT dividends</p>
                        <p>• Borrower must post collateral ≥ your minimum requirement</p>
                      </div>

                      {!address ? (
                        <Button onClick={connect} disabled={isConnecting} className="w-full bg-gradient-fire text-primary-foreground" size="lg">Connect Wallet</Button>
                      ) : (
                        <Button onClick={handleCreateOffer} disabled={isExecuting} className="w-full bg-gradient-fire text-primary-foreground hover:opacity-90" size="lg">
                          {isExecuting ? "Creating…" : "Create Loan Offer"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* My Loans Tab */}
            <TabsContent value="loans">
              {activeLoans.length === 0 ? (
                <Card className="border-border/40 bg-card/60">
                  <CardContent className="py-12 text-center">
                    <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No active loans yet. Borrow from the pool or fill a P2P offer.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {activeLoans.map((loan) => (
                    <Card key={loan.id} className="border-border/40 bg-card/80">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <img src={TOKEN_LOGOS[loan.token as keyof typeof TOKEN_LOGOS]} alt="" className="h-5 w-5 rounded-full" />
                              <span className="font-semibold">{loan.amount.toLocaleString()} {loan.token}</span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] ${loan.type === "pool" ? "bg-primary/10 text-primary" : "bg-ember/10 text-ember"}`}>
                                {loan.type === "pool" ? "Pool" : "P2P"}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                                loan.status === "active" ? "bg-amber-500/10 text-amber-400" : loan.status === "repaid" ? "bg-green-500/10 text-green-400" : "bg-destructive/10 text-destructive"
                              }`}>
                                {loan.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                              <span>Collateral: {loan.collateralAmount.toLocaleString()} {loan.collateralToken}</span>
                              <span>APR: {loan.interestRate}%</span>
                              <span>Due: {loan.dueDate.toLocaleDateString()}</span>
                            </div>
                            <p className="text-[10px] font-mono text-muted-foreground/60">ID: {loan.id}</p>
                          </div>
                          {loan.status === "active" && (
                            <Button size="sm" variant="outline" onClick={() => handleRepay(loan)} disabled={isExecuting}>
                              Repay
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Info Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Landmark, title: "Pool Lending", desc: "Deposit to earn supply APY. Borrowers post 150% collateral for safety.", color: "text-blaze" },
              { icon: Users, title: "P2P Lending", desc: "Set your own rates and terms. Lend directly to other users with custom collateral.", color: "text-ember" },
              { icon: Flame, title: "Fee Distribution", desc: "0.3% fee on all loans: 50% burned, 30% to stakers, 20% to EQT dividends.", color: "text-equity" },
            ].map((c, i) => (
              <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
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

export default TwinFlameLending;
