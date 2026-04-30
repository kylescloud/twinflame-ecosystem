import { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, formatUnits, isAddress, ZeroAddress } from "ethers";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ExternalLink,
  Heart,
  RefreshCw,
  Shield,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import {
  CONTRACTS,
  LENDING_POOL_ABI,
  NATIVE_USD_PRICES,
  TOKEN_INFO,
  healthFactorTier,
} from "@/lib/contracts";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";

// ── Reverse address → symbol lookup (Trinity tokens + USDC placeholder) ──
const ADDR_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  Object.values(TOKEN_INFO).map((t) => [t.address.toLowerCase(), t.symbol]),
);
const symbolFromAddr = (addr: string) =>
  ADDR_TO_SYMBOL[addr.toLowerCase()] ?? `${addr.slice(0, 6)}…${addr.slice(-4)}`;
const logoFromSym = (sym: string) =>
  (TOKEN_LOGOS as Record<string, string>)[sym] ?? "";

const PRICE_USD: Record<string, number> = { ...NATIVE_USD_PRICES, USDC: 1, WETH: 3200 };

// ── Lending contract considered "live" only if deployed to a non-placeholder address ──
const isPlaceholder = (a: string) => /^0x0+0*[0-9a-f]{0,3}$/i.test(a);
const LENDING_LIVE = isAddress(CONTRACTS.TWINFLAME_LENDING) && !isPlaceholder(CONTRACTS.TWINFLAME_LENDING);

interface LoanRow {
  id: bigint;
  borrower: string;
  borrowSym: string;
  collateralSym: string;
  borrowToken: string;
  collateralToken: string;
  principal: number;
  collateralAmount: number;
  rateBps: number;
  startTime: number;
  dueDate: number;
  kind: "Pool" | "P2P";
  // Live view-fn outputs
  owed: number;
  hf: number; // 1e18-scaled → number
  liq: { owed: number; toLiquidator: number; refund: number };
}

interface MaxBorrowRow {
  symbol: string;
  amount: number; // max borrow units of `symbol`
}

const fmt = (n: number, d = 4) =>
  isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : "—";
const usdOf = (sym: string, amt: number) => amt * (PRICE_USD[sym] ?? 0);

// ── Demo fallback rows (used when contract not deployed) ──
const seedDemo = (me: string): LoanRow[] => {
  const now = Math.floor(Date.now() / 1000);
  const mkRow = (
    id: number,
    borrowSym: string,
    principal: number,
    collateralSym: string,
    collateralAmount: number,
    rateBps: number,
    daysAgo: number,
  ): LoanRow => {
    const elapsed = daysAgo * 86_400;
    const interest = principal * (rateBps / 10_000) * (elapsed / (365 * 86_400));
    const owed = principal + interest;
    const colUsd = usdOf(collateralSym, collateralAmount);
    const borrowUsd = usdOf(borrowSym, owed);
    const hf = borrowUsd === 0 ? Infinity : (colUsd * 0.8333) / borrowUsd;
    const colForDebt = borrowUsd / (PRICE_USD[collateralSym] ?? 1);
    const bonus = colForDebt * 0.05;
    const toLiquidator = Math.min(collateralAmount, colForDebt + bonus);
    return {
      id: BigInt(id),
      borrower: me,
      borrowSym,
      collateralSym,
      borrowToken: TOKEN_INFO[borrowSym as keyof typeof TOKEN_INFO]?.address ?? ZeroAddress,
      collateralToken: TOKEN_INFO[collateralSym as keyof typeof TOKEN_INFO]?.address ?? ZeroAddress,
      principal,
      collateralAmount,
      rateBps,
      startTime: now - elapsed,
      dueDate: 0,
      kind: "Pool",
      owed,
      hf,
      liq: { owed, toLiquidator, refund: Math.max(0, collateralAmount - toLiquidator) },
    };
  };
  return [
    mkRow(1, "USDC", 1500, "BLAZE", 28_000, 940, 14),
    mkRow(2, "EMBER", 8_000, "USDC", 1_350, 1120, 3),
    mkRow(3, "BLAZE", 9_500, "EMBER", 11_500, 850, 90),
  ];
};

const HFPill = ({ hf }: { hf: number }) => {
  const tier = isFinite(hf) ? healthFactorTier(hf) : "safe";
  const cls =
    tier === "safe"
      ? "bg-[hsl(142,70%,50%)]/10 text-[hsl(142,70%,50%)]"
      : tier === "warn"
        ? "bg-amber-400/10 text-amber-400"
        : "bg-destructive/10 text-destructive";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      HF {isFinite(hf) ? hf.toFixed(2) : "∞"}
    </span>
  );
};

const MyLoansPanel = () => {
  const { address, connect } = useWallet();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(!LENDING_LIVE);
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [aggHF, setAggHF] = useState<number>(Infinity);

  // Max-borrow simulator state
  const [collatSym, setCollatSym] = useState<string>("BLAZE");
  const [collatAmt, setCollatAmt] = useState<string>("10000");
  const [maxBorrowRows, setMaxBorrowRows] = useState<MaxBorrowRow[]>([]);

  // ── Loader: prefers on-chain views; gracefully falls back to deterministic demo data ──
  const load = async () => {
    if (!address) return;
    setLoading(true);
    try {
      if (!LENDING_LIVE) {
        const demo = seedDemo(address);
        setLoans(demo);
        const totBorrow = demo.reduce((s, l) => s + usdOf(l.borrowSym, l.owed), 0);
        const totCol = demo.reduce((s, l) => s + usdOf(l.collateralSym, l.collateralAmount) * 0.8333, 0);
        setAggHF(totBorrow === 0 ? Infinity : totCol / totBorrow);
        setUsingFallback(true);
      } else {
        const provider = new BrowserProvider((window as any).ethereum);
        const lending = new Contract(CONTRACTS.TWINFLAME_LENDING, LENDING_POOL_ABI, provider);

        const ids: bigint[] = await lending.getUserLoans(address);
        const rows: LoanRow[] = [];
        for (const id of ids) {
          const L = await lending.getLoan(id);
          if (L.repaid || L.liquidated) continue;
          const owed: bigint = await lending.amountOwed(id);
          const hfE18: bigint = await lending.healthFactor(id);
          let liq = { owed: 0, toLiquidator: 0, refund: 0 };
          try {
            const p = await lending.previewLiquidation(id);
            liq = {
              owed: Number(formatUnits(p.owed, 18)),
              toLiquidator: Number(formatUnits(p.toLiquidator, 18)),
              refund: Number(formatUnits(p.refund, 18)),
            };
          } catch {
            // _previewLiquidation reverts if oracle has no price; leave zeros
          }
          rows.push({
            id,
            borrower: L.borrower,
            borrowSym: symbolFromAddr(L.token),
            collateralSym: symbolFromAddr(L.collateralToken),
            borrowToken: L.token,
            collateralToken: L.collateralToken,
            principal: Number(formatUnits(L.amount, 18)),
            collateralAmount: Number(formatUnits(L.collateralAmount, 18)),
            rateBps: Number(L.interestRateBps),
            startTime: Number(L.startTime),
            dueDate: Number(L.dueDate),
            kind: Number(L.kind) === 0 ? "Pool" : "P2P",
            owed: Number(formatUnits(owed, 18)),
            hf: Number(formatUnits(hfE18, 18)),
            liq,
          });
        }
        setLoans(rows);
        const userHfE18: bigint = await lending.userHealthFactor(address);
        setAggHF(Number(formatUnits(userHfE18, 18)));
        setUsingFallback(false);
      }
    } catch (e: any) {
      console.warn("[MyLoansPanel] on-chain fetch failed, using demo:", e?.message);
      const demo = seedDemo(address);
      setLoans(demo);
      setAggHF(2.1);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // ── Max-borrow preview across markets ──
  const computeMaxBorrow = async () => {
    const amt = parseFloat(collatAmt);
    if (!amt || amt <= 0) return setMaxBorrowRows([]);
    const targets = ["BLAZE", "EMBER", "EQT", "USDC"].filter((s) => s !== collatSym);

    if (LENDING_LIVE && address) {
      try {
        const provider = new BrowserProvider((window as any).ethereum);
        const lending = new Contract(CONTRACTS.TWINFLAME_LENDING, LENDING_POOL_ABI, provider);
        const colAddr = TOKEN_INFO[collatSym as keyof typeof TOKEN_INFO]?.address;
        const out: MaxBorrowRow[] = [];
        for (const sym of targets) {
          const tokAddr = TOKEN_INFO[sym as keyof typeof TOKEN_INFO]?.address;
          if (!colAddr || !tokAddr) continue;
          try {
            const v: bigint = await lending.maxBorrow(tokAddr, colAddr, BigInt(Math.floor(amt * 1e18)));
            out.push({ symbol: sym, amount: Number(formatUnits(v, 18)) });
          } catch {
            /* missing price */
          }
        }
        setMaxBorrowRows(out);
        return;
      } catch {
        /* fall through */
      }
    }
    // Fallback: collateralFactor 6667 bps (66.67%)
    const colUsd = usdOf(collatSym, amt);
    const maxUsd = colUsd * 0.6667;
    setMaxBorrowRows(
      targets.map((sym) => ({ symbol: sym, amount: PRICE_USD[sym] ? maxUsd / PRICE_USD[sym] : 0 })),
    );
  };

  useEffect(() => {
    computeMaxBorrow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collatSym, collatAmt, address]);

  const totals = useMemo(() => {
    const borrowUsd = loans.reduce((s, l) => s + usdOf(l.borrowSym, l.owed), 0);
    const colUsd = loans.reduce((s, l) => s + usdOf(l.collateralSym, l.collateralAmount), 0);
    return { borrowUsd, colUsd, count: loans.length };
  }, [loans]);

  if (!address) {
    return (
      <Card className="border-border/40 bg-gradient-to-br from-card/80 to-card/40">
        <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <Heart className="h-8 w-8 text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">Connect to view your loans</h3>
          <p className="max-w-md text-xs text-muted-foreground">
            We pull <code>getUserLoans</code>, <code>amountOwed</code>, <code>healthFactor</code>,
            <code> userHealthFactor</code>, <code>maxBorrow</code> and <code>previewLiquidation</code> directly
            from the TwinFlame Lending contract.
          </p>
          <Button onClick={connect} className="bg-gradient-fire text-primary-foreground hover:opacity-90">
            Connect wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="border-border/40 bg-gradient-to-br from-card/80 to-card/40">
        <CardContent className="space-y-5 p-5">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold text-foreground">My Open Loans</h2>
              <Badge variant="outline" className="border-border/40 text-[10px]">
                {usingFallback ? "Simulated · contract not deployed" : "Live · on-chain views"}
              </Badge>
            </div>
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>

          {/* Aggregate summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border border-border/40 bg-muted/10 p-3">
              <p className="text-[10px] text-muted-foreground">Open Loans</p>
              <p className="font-display text-xl font-bold text-foreground">{totals.count}</p>
            </div>
            <div className="rounded-md border border-border/40 bg-muted/10 p-3">
              <p className="text-[10px] text-muted-foreground">Total Owed</p>
              <p className="font-display text-xl font-bold text-foreground">${fmt(totals.borrowUsd, 2)}</p>
            </div>
            <div className="rounded-md border border-border/40 bg-muted/10 p-3">
              <p className="text-[10px] text-muted-foreground">Total Collateral</p>
              <p className="font-display text-xl font-bold text-foreground">${fmt(totals.colUsd, 2)}</p>
            </div>
            <div className="rounded-md border border-border/40 bg-muted/10 p-3">
              <p className="text-[10px] text-muted-foreground">Account HF</p>
              <p
                className={`font-display text-xl font-bold ${
                  !isFinite(aggHF)
                    ? "text-muted-foreground"
                    : aggHF >= 1.5
                      ? "text-[hsl(142,70%,50%)]"
                      : aggHF >= 1.2
                        ? "text-amber-400"
                        : "text-destructive"
                }`}
              >
                {isFinite(aggHF) ? aggHF.toFixed(2) : "∞"}
              </p>
            </div>
          </div>

          {/* Loans table */}
          {loans.length === 0 ? (
            <div className="rounded-md border border-border/40 bg-muted/10 p-6 text-center">
              <p className="text-sm text-foreground">No open loans</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Borrow against collateral below to start a position.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {loans.map((l) => {
                const interest = l.owed - l.principal;
                const days = (Date.now() / 1000 - l.startTime) / 86_400;
                const tier = isFinite(l.hf) ? healthFactorTier(l.hf) : "safe";
                const liqPreviewFailed = l.liq.toLiquidator === 0 && l.liq.refund === 0;

                return (
                  <motion.div
                    key={l.id.toString()}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      className={`border-border/40 bg-card/60 ${
                        tier === "danger" ? "border-destructive/50" : tier === "warn" ? "border-amber-400/40" : ""
                      }`}
                    >
                      <CardContent className="space-y-3 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <img src={logoFromSym(l.borrowSym)} alt="" className="h-7 w-7 rounded-full" />
                            <div>
                              <p className="font-semibold text-foreground">
                                {fmt(l.principal, 2)} {l.borrowSym}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                #{l.id.toString()} · {l.kind} · {(l.rateBps / 100).toFixed(2)}% APR · {days.toFixed(1)}d
                              </p>
                            </div>
                          </div>
                          <HFPill hf={l.hf} />
                        </div>

                        {/* Per-loan view-function readout */}
                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="rounded-md border border-border/30 bg-muted/10 p-2">
                                <p className="text-[10px] text-muted-foreground">amountOwed</p>
                                <p className="font-mono text-foreground">{fmt(l.owed)}</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Principal + accrued linear interest from contract.</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="rounded-md border border-border/30 bg-muted/10 p-2">
                                <p className="text-[10px] text-muted-foreground">interest</p>
                                <p className="font-mono text-amber-400">+{fmt(interest)}</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Owed − principal.</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="rounded-md border border-border/30 bg-muted/10 p-2">
                                <p className="text-[10px] text-muted-foreground">collateral</p>
                                <p className="font-mono text-foreground">
                                  {fmt(l.collateralAmount, 2)} {l.collateralSym}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Posted collateral, currently held by lending contract.</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="rounded-md border border-border/30 bg-muted/10 p-2">
                                <p className="text-[10px] text-muted-foreground">healthFactor</p>
                                <p
                                  className={`font-mono ${
                                    tier === "safe"
                                      ? "text-[hsl(142,70%,50%)]"
                                      : tier === "warn"
                                        ? "text-amber-400"
                                        : "text-destructive"
                                  }`}
                                >
                                  {isFinite(l.hf) ? l.hf.toFixed(4) : "∞"}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>(collateralUSD × liqThreshold) ÷ owedUSD, scaled 1e18.</TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Liquidation preview */}
                        <div
                          className={`rounded-md border p-3 text-xs ${
                            tier === "danger"
                              ? "border-destructive/40 bg-destructive/5"
                              : "border-border/40 bg-muted/10"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Shield className="h-3 w-3" /> previewLiquidation
                            </span>
                            {tier === "danger" ? (
                              <span className="flex items-center gap-1 text-destructive">
                                <AlertTriangle className="h-3 w-3" /> Liquidatable now
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Hypothetical</span>
                            )}
                          </div>
                          {liqPreviewFailed ? (
                            <p className="text-muted-foreground">
                              Oracle missing collateral price — preview unavailable.
                            </p>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <p className="text-[10px] text-muted-foreground">Owed (repay-in)</p>
                                <p className="font-mono text-foreground">
                                  {fmt(l.liq.owed, 4)} {l.borrowSym}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground">Liquidator gets</p>
                                <p className="font-mono text-foreground">
                                  {fmt(l.liq.toLiquidator, 4)} {l.collateralSym}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground">Refund to you</p>
                                <p className="font-mono text-[hsl(142,70%,50%)]">
                                  {fmt(l.liq.refund, 4)} {l.collateralSym}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              toast({
                                title: `repay(${l.id.toString()})`,
                                description: `Will pay ${fmt(l.owed, 4)} ${l.borrowSym} + 0.30% protocol fee.`,
                              })
                            }
                          >
                            Repay {fmt(l.owed, 2)} {l.borrowSym}
                          </Button>
                          {tier === "danger" && l.borrower.toLowerCase() !== address.toLowerCase() && (
                            <Button
                              size="sm"
                              className="bg-destructive text-destructive-foreground hover:opacity-90"
                              onClick={() =>
                                toast({
                                  title: `liquidate(${l.id.toString()})`,
                                  description: `Seize ${fmt(l.liq.toLiquidator, 4)} ${l.collateralSym}.`,
                                })
                              }
                            >
                              <Zap className="mr-1 h-3 w-3" /> Liquidate
                            </Button>
                          )}
                          {!usingFallback && (
                            <Button
                              size="sm"
                              variant="ghost"
                              asChild
                              className="text-muted-foreground"
                            >
                              <a
                                href={`https://polygonscan.com/address/${CONTRACTS.TWINFLAME_LENDING}#readContract`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View on Polygonscan <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Max-borrow simulator (calls maxBorrow view) */}
          <div className="rounded-md border border-border/40 bg-muted/10 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold text-foreground">Max-borrow simulator</h3>
              <Badge variant="outline" className="border-border/40 text-[10px]">
                view: maxBorrow()
              </Badge>
            </div>
            <div className="grid grid-cols-[120px,1fr] gap-2 sm:max-w-md">
              <select
                value={collatSym}
                onChange={(e) => setCollatSym(e.target.value)}
                className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm text-foreground"
              >
                {["BLAZE", "EMBER", "EQT", "USDC"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <Input
                type="number"
                value={collatAmt}
                onChange={(e) => setCollatAmt(e.target.value)}
                placeholder="Collateral amount"
                className="border-border/50 bg-muted/20"
              />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {maxBorrowRows.length === 0 ? (
                <p className="col-span-full text-xs text-muted-foreground">
                  Enter a collateral amount above to see borrowing power.
                </p>
              ) : (
                maxBorrowRows.map((r) => (
                  <div
                    key={r.symbol}
                    className="flex items-center justify-between rounded-md border border-border/30 bg-muted/10 p-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <img src={logoFromSym(r.symbol)} alt="" className="h-5 w-5 rounded-full" />
                      <span className="text-foreground">{r.symbol}</span>
                    </div>
                    <span className="font-mono text-foreground">{fmt(r.amount, 2)}</span>
                  </div>
                ))
              )}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Borrowing power is gated by the contract's <code>collateralFactorBps</code> (currently 66.67% ⇒
              150% min CR).
            </p>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default MyLoansPanel;
