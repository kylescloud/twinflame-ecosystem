import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, ArrowDown, ArrowUp, Heart, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";
import { NATIVE_USD_PRICES, LENDING_CONFIG, healthFactorTier } from "@/lib/contracts";

type Sym = "BLAZE" | "EMBER" | "EQT" | "USDC";

const SYMBOLS: Sym[] = ["BLAZE", "EMBER", "EQT", "USDC"];
const PRICES: Record<Sym, number> = { ...NATIVE_USD_PRICES, USDC: 1 } as Record<Sym, number>;
const APY: Record<Sym, { supply: number; borrow: number }> = {
  BLAZE: { supply: 4.2, borrow: 8.5 },
  EMBER: { supply: 5.8, borrow: 11.2 },
  EQT:   { supply: 3.1, borrow: 6.8 },
  USDC:  { supply: 6.2, borrow: 9.4 },
};

interface Position {
  id: string;
  borrower: string;
  borrowToken: Sym;
  borrowAmount: number; // principal
  collateralToken: Sym;
  collateralAmount: number;
  rateBps: number;
  startTime: number; // unix sec
}

const COLLATERAL_FACTOR_BPS = 6667; // 150% CR ⇒ 66.67%
const LIQ_THRESHOLD_BPS = 8333;     // 120% CR
const LIQ_BONUS_BPS = 500;          // 5%
const BPS = 10_000;

const usd = (sym: Sym, amount: number) => amount * PRICES[sym];
const accruedOwed = (p: Position) => {
  const elapsedDays = (Date.now() / 1000 - p.startTime) / 86_400;
  const interest = p.borrowAmount * (p.rateBps / BPS) * (elapsedDays / 365);
  return p.borrowAmount + interest;
};

const positionHF = (p: Position): number => {
  const owed = accruedOwed(p);
  const borrowUsd = usd(p.borrowToken, owed);
  if (borrowUsd === 0) return Infinity;
  const colUsd = usd(p.collateralToken, p.collateralAmount);
  return (colUsd * (LIQ_THRESHOLD_BPS / BPS)) / borrowUsd;
};

const aggregateHF = (positions: Position[], borrower: string): number => {
  const open = positions.filter((p) => p.borrower === borrower);
  let totalBorrowUsd = 0;
  let totalColAdjUsd = 0;
  for (const p of open) {
    totalBorrowUsd += usd(p.borrowToken, accruedOwed(p));
    totalColAdjUsd += usd(p.collateralToken, p.collateralAmount) * (LIQ_THRESHOLD_BPS / BPS);
  }
  if (totalBorrowUsd === 0) return Infinity;
  return totalColAdjUsd / totalBorrowUsd;
};

// Seed with a few demo positions, including a near-liquidation one
const seedPositions = (): Position[] => {
  const now = Math.floor(Date.now() / 1000);
  return [
    {
      id: "loan-1", borrower: "0xMe", borrowToken: "USDC", borrowAmount: 1500,
      collateralToken: "BLAZE", collateralAmount: 28_000, rateBps: 940, startTime: now - 86_400 * 14,
    },
    {
      id: "loan-2", borrower: "0xMe", borrowToken: "EMBER", borrowAmount: 8_000,
      collateralToken: "USDC", collateralAmount: 1_350, rateBps: 1120, startTime: now - 86_400 * 3,
    },
    {
      id: "loan-3", borrower: "0xRiskyBob", borrowToken: "USDC", borrowAmount: 420,
      collateralToken: "EMBER", collateralAmount: 4_700, rateBps: 940, startTime: now - 86_400 * 60,
    },
    {
      id: "loan-4", borrower: "0xRiskyBob", borrowToken: "BLAZE", borrowAmount: 9_500,
      collateralToken: "EMBER", collateralAmount: 11_500, rateBps: 850, startTime: now - 86_400 * 90,
    },
  ];
};

const HFGauge = ({ hf }: { hf: number }) => {
  const tier = isFinite(hf) ? healthFactorTier(hf) : "safe";
  const color =
    tier === "safe" ? "text-[hsl(142,70%,50%)]" :
    tier === "warn" ? "text-amber-400" :
    "text-destructive";
  const bg =
    tier === "safe" ? "bg-[hsl(142,70%,50%)]" :
    tier === "warn" ? "bg-amber-400" :
    "bg-destructive";
  const pct = Math.min(100, isFinite(hf) ? (hf / 3) * 100 : 100); // 3.0 = full bar
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Health Factor</span>
        <span className={`font-display text-2xl font-bold ${color}`}>
          {isFinite(hf) ? hf.toFixed(2) : "∞"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/40">
        <motion.div className={`h-full ${bg}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {tier === "safe" && "✅ Safe — well above liquidation threshold"}
        {tier === "warn" && "⚠️ Caution — add collateral or repay to avoid liquidation"}
        {tier === "danger" && "🚨 At risk — position is liquidatable"}
      </p>
    </div>
  );
};

const LendingPanel = () => {
  const { address, connect } = useWallet();
  const { toast } = useToast();
  const me = address ?? "0xMe"; // demo borrower id

  const [positions, setPositions] = useState<Position[]>(seedPositions);
  const [tick, setTick] = useState(0);

  // Re-render every 15s so accrued interest + HF update live
  useEffect(() => {
    const i = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(i);
  }, []);
  void tick;

  // ── Supply form ──
  const [supply, setSupply] = useState({ token: "USDC" as Sym, amount: "" });
  const handleSupply = () => {
    if (!address) return connect();
    const amt = parseFloat(supply.amount);
    if (!amt || amt <= 0) return toast({ title: "Invalid amount", variant: "destructive" });
    toast({ title: "Supplied", description: `deposit(${supply.token}, ${amt}) — earning ${APY[supply.token].supply}% APY` });
    setSupply({ ...supply, amount: "" });
  };

  // ── Borrow form ──
  const [borrow, setBorrow] = useState({
    token: "USDC" as Sym, amount: "",
    collateralToken: "BLAZE" as Sym, collateralAmount: "",
  });
  const borrowPreview = useMemo(() => {
    const colAmt = parseFloat(borrow.collateralAmount) || 0;
    const wantAmt = parseFloat(borrow.amount) || 0;
    const colUsd = usd(borrow.collateralToken, colAmt);
    const maxBorrowUsd = colUsd * (COLLATERAL_FACTOR_BPS / BPS);
    const maxBorrow = PRICES[borrow.token] > 0 ? maxBorrowUsd / PRICES[borrow.token] : 0;
    const borrowUsd = usd(borrow.token, wantAmt);
    const projectedHF = borrowUsd > 0 ? (colUsd * (LIQ_THRESHOLD_BPS / BPS)) / borrowUsd : Infinity;
    const utilization = maxBorrowUsd > 0 ? Math.min(100, (borrowUsd / maxBorrowUsd) * 100) : 0;
    const insufficient = wantAmt > 0 && borrowUsd > maxBorrowUsd;
    return { maxBorrow, projectedHF, utilization, insufficient };
  }, [borrow]);

  const handleBorrow = () => {
    if (!address) return connect();
    const wantAmt = parseFloat(borrow.amount);
    const colAmt = parseFloat(borrow.collateralAmount);
    if (!wantAmt || !colAmt) return toast({ title: "Fill borrow + collateral", variant: "destructive" });
    if (borrowPreview.insufficient) {
      return toast({ title: "Insufficient collateral", description: "Borrow would breach 150% CR.", variant: "destructive" });
    }
    if (borrow.token === borrow.collateralToken) {
      return toast({ title: "Pick a different collateral asset", variant: "destructive" });
    }
    const newPos: Position = {
      id: `loan-${Date.now()}`,
      borrower: me,
      borrowToken: borrow.token,
      borrowAmount: wantAmt,
      collateralToken: borrow.collateralToken,
      collateralAmount: colAmt,
      rateBps: Math.round(APY[borrow.token].borrow * 100),
      startTime: Math.floor(Date.now() / 1000),
    };
    setPositions((ps) => [newPos, ...ps]);
    toast({
      title: "Borrowed",
      description: `borrow(${borrow.token}, ${wantAmt}, ${borrow.collateralToken}, ${colAmt})`,
    });
    setBorrow({ ...borrow, amount: "", collateralAmount: "" });
  };

  const handleRepay = (p: Position) => {
    if (!address) return connect();
    const owed = accruedOwed(p);
    const fee = owed * (LENDING_CONFIG.PROTOCOL_FEE_BPS / 10_000);
    setPositions((ps) => ps.filter((x) => x.id !== p.id));
    toast({
      title: "Loan repaid",
      description: `Paid ${owed.toFixed(4)} ${p.borrowToken} + ${fee.toFixed(4)} fee · collateral returned.`,
    });
  };

  const handleLiquidate = (p: Position) => {
    if (!address) return connect();
    const owed = accruedOwed(p);
    const debtUsd = usd(p.borrowToken, owed);
    const colForDebt = debtUsd / PRICES[p.collateralToken];
    const bonus = colForDebt * (LIQ_BONUS_BPS / BPS);
    const seized = Math.min(p.collateralAmount, colForDebt + bonus);
    const refund = Math.max(0, p.collateralAmount - seized);
    setPositions((ps) => ps.filter((x) => x.id !== p.id));
    toast({
      title: "Position liquidated",
      description: `Seized ${seized.toFixed(2)} ${p.collateralToken} (${(LIQ_BONUS_BPS / 100).toFixed(1)}% bonus). Refund: ${refund.toFixed(2)}.`,
    });
  };

  const myPositions = positions.filter((p) => p.borrower === me);
  const liquidatable = positions.filter((p) => p.borrower !== me && positionHF(p) < 1);
  const myHF = aggregateHF(positions, me);

  return (
    <Card className="border-border/40 bg-gradient-to-br from-card/80 to-card/40">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">Your Lending Position</h2>
        </div>

        <HFGauge hf={myHF} />

        {!isFinite(myHF) && (
          <p className="rounded-md border border-border/40 bg-muted/10 p-3 text-xs text-muted-foreground">
            No open debt. Borrow against collateral below to start a position.
          </p>
        )}

        <Tabs defaultValue="borrow" className="space-y-3">
          <TabsList className="bg-muted/30">
            <TabsTrigger value="supply"><ArrowUp className="mr-1 h-3 w-3" />Supply</TabsTrigger>
            <TabsTrigger value="borrow"><ArrowDown className="mr-1 h-3 w-3" />Borrow</TabsTrigger>
            <TabsTrigger value="positions"><Activity className="mr-1 h-3 w-3" />My Loans ({myPositions.length})</TabsTrigger>
            <TabsTrigger value="liquidate"><Zap className="mr-1 h-3 w-3" />Liquidate ({liquidatable.length})</TabsTrigger>
          </TabsList>

          {/* SUPPLY */}
          <TabsContent value="supply" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[140px,1fr,auto]">
              <select
                value={supply.token}
                onChange={(e) => setSupply({ ...supply, token: e.target.value as Sym })}
                className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm text-foreground"
              >
                {SYMBOLS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <Input type="number" placeholder="Amount" value={supply.amount} onChange={(e) => setSupply({ ...supply, amount: e.target.value })} className="border-border/50 bg-muted/20" />
              <Button onClick={handleSupply} className="bg-gradient-fire text-primary-foreground hover:opacity-90">
                Supply @ {APY[supply.token].supply}%
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Supplied assets earn variable APY and back the pooled lending market. Withdraw any time subject to available liquidity.
            </p>
          </TabsContent>

          {/* BORROW */}
          <TabsContent value="borrow" className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Collateral</label>
                <div className="grid grid-cols-[120px,1fr] gap-2">
                  <select
                    value={borrow.collateralToken}
                    onChange={(e) => setBorrow({ ...borrow, collateralToken: e.target.value as Sym })}
                    className="rounded-md border border-border/50 bg-muted/20 px-2 py-2 text-sm text-foreground"
                  >
                    {SYMBOLS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <Input type="number" placeholder="Amount" value={borrow.collateralAmount} onChange={(e) => setBorrow({ ...borrow, collateralAmount: e.target.value })} className="border-border/50 bg-muted/20" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Borrow <span className="text-foreground/70">(max {borrowPreview.maxBorrow.toFixed(2)})</span>
                </label>
                <div className="grid grid-cols-[120px,1fr] gap-2">
                  <select
                    value={borrow.token}
                    onChange={(e) => setBorrow({ ...borrow, token: e.target.value as Sym })}
                    className="rounded-md border border-border/50 bg-muted/20 px-2 py-2 text-sm text-foreground"
                  >
                    {SYMBOLS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <Input type="number" placeholder="Amount" value={borrow.amount} onChange={(e) => setBorrow({ ...borrow, amount: e.target.value })} className="border-border/50 bg-muted/20" />
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div className="space-y-2 rounded-md border border-border/40 bg-muted/10 p-3 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Collateral utilization</span><span className="text-foreground">{borrowPreview.utilization.toFixed(0)}%</span></div>
              <div className="h-1 overflow-hidden rounded-full bg-muted/40">
                <div
                  className={`h-full ${borrowPreview.utilization > 95 ? "bg-destructive" : borrowPreview.utilization > 75 ? "bg-amber-400" : "bg-[hsl(142,70%,50%)]"}`}
                  style={{ width: `${borrowPreview.utilization}%` }}
                />
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Borrow APY</span><span className="text-amber-400">{APY[borrow.token].borrow}%</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Projected HF after borrow</span>
                <span className={
                  !isFinite(borrowPreview.projectedHF) ? "text-muted-foreground" :
                  borrowPreview.projectedHF >= 1.5 ? "text-[hsl(142,70%,50%)]" :
                  borrowPreview.projectedHF >= 1.2 ? "text-amber-400" :
                  "text-destructive"
                }>
                  {isFinite(borrowPreview.projectedHF) ? borrowPreview.projectedHF.toFixed(2) : "∞"}
                </span>
              </div>
              {borrowPreview.insufficient && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-3 w-3" /> Borrow would exceed 150% min collateral ratio
                </div>
              )}
            </div>

            <Button
              onClick={handleBorrow}
              disabled={borrowPreview.insufficient}
              className="w-full bg-gradient-fire text-primary-foreground hover:opacity-90"
            >
              Borrow {borrow.amount || "0"} {borrow.token}
            </Button>
          </TabsContent>

          {/* MY POSITIONS */}
          <TabsContent value="positions" className="space-y-2">
            {myPositions.length === 0 ? (
              <p className="rounded-md border border-border/40 bg-muted/10 p-4 text-center text-xs text-muted-foreground">
                No open loans.
              </p>
            ) : myPositions.map((p) => {
              const owed = accruedOwed(p);
              const interest = owed - p.borrowAmount;
              const hf = positionHF(p);
              const tier = healthFactorTier(hf);
              return (
                <Card key={p.id} className="border-border/40 bg-card/60">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={TOKEN_LOGOS[p.borrowToken as keyof typeof TOKEN_LOGOS] ?? ""} alt="" className="h-6 w-6 rounded-full" />
                        <span className="font-semibold text-foreground">{p.borrowAmount.toFixed(2)} {p.borrowToken}</span>
                        <span className="text-[10px] text-muted-foreground">@ {(p.rateBps / 100).toFixed(2)}% APR</span>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        tier === "safe" ? "bg-[hsl(142,70%,50%)]/10 text-[hsl(142,70%,50%)]" :
                        tier === "warn" ? "bg-amber-400/10 text-amber-400" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        HF {hf.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <div><p className="text-muted-foreground">Owed</p><p className="text-foreground">{owed.toFixed(4)}</p></div>
                      <div><p className="text-muted-foreground">Interest</p><p className="text-amber-400">+{interest.toFixed(4)}</p></div>
                      <div><p className="text-muted-foreground">Collateral</p><p className="text-foreground">{p.collateralAmount.toFixed(2)} {p.collateralToken}</p></div>
                      <div><p className="text-muted-foreground">Days open</p><p className="text-foreground">{((Date.now() / 1000 - p.startTime) / 86_400).toFixed(1)}d</p></div>
                    </div>
                    <Button onClick={() => handleRepay(p)} size="sm" variant="outline" className="mt-3 w-full">
                      Repay {owed.toFixed(2)} {p.borrowToken} (+ 0.30% fee)
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* LIQUIDATE */}
          <TabsContent value="liquidate" className="space-y-2">
            {liquidatable.length === 0 ? (
              <p className="rounded-md border border-border/40 bg-muted/10 p-4 text-center text-xs text-muted-foreground">
                No liquidatable positions right now. Liquidators earn a 5% bonus when HF &lt; 1.
              </p>
            ) : liquidatable.map((p) => {
              const owed = accruedOwed(p);
              const debtUsd = usd(p.borrowToken, owed);
              const colForDebt = debtUsd / PRICES[p.collateralToken];
              const bonus = colForDebt * (LIQ_BONUS_BPS / BPS);
              const seized = Math.min(p.collateralAmount, colForDebt + bonus);
              const hf = positionHF(p);
              return (
                <Card key={p.id} className="border-destructive/40 bg-destructive/5">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">{p.id} · {p.borrower}</span>
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                        HF {hf.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><p className="text-muted-foreground">Owed</p><p className="text-foreground">{owed.toFixed(2)} {p.borrowToken}</p></div>
                      <div><p className="text-muted-foreground">Seize</p><p className="text-foreground">{seized.toFixed(2)} {p.collateralToken}</p></div>
                      <div><p className="text-muted-foreground">Bonus</p><p className="text-[hsl(142,70%,50%)]">+{bonus.toFixed(2)}</p></div>
                    </div>
                    <Button onClick={() => handleLiquidate(p)} size="sm" className="mt-3 w-full bg-destructive text-destructive-foreground hover:opacity-90">
                      <Zap className="mr-1 h-3 w-3" /> Liquidate
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LendingPanel;
