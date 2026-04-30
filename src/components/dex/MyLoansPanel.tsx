import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserProvider, Contract, formatUnits, isAddress, parseUnits, ZeroAddress } from "ethers";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ExternalLink,
  Heart,
  Loader2,
  RefreshCw,
  Shield,
  Sliders,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWallet } from "@/hooks/useWallet";
import {
  CONTRACTS,
  ERC20_ABI,
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

// Auto-refresh cadence
const REFRESH_MS = 20_000;
// Liquidation bonus mirrors contract `liquidationBonusBps = 500` (5%)
const LIQ_BONUS_BPS = 500;
const BPS = 10_000;

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
  owed: number;
  hf: number;
  liq: { owed: number; toLiquidator: number; refund: number };
  liqError?: string;
}

interface MaxBorrowRow {
  symbol: string;
  amount: number;
}

const fmt = (n: number, d = 4) =>
  isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : "—";
const usdOf = (sym: string, amt: number) => amt * (PRICE_USD[sym] ?? 0);

// Decode ethers/RPC errors into a short user-readable string
const friendlyError = (e: any): string => {
  if (!e) return "Unknown error";
  if (e?.shortMessage) return e.shortMessage;
  if (e?.reason) return e.reason;
  if (e?.info?.error?.message) return e.info.error.message;
  if (typeof e?.message === "string") return e.message.split("\n")[0].slice(0, 160);
  return "Transaction failed";
};

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
    const interest = principal * (rateBps / BPS) * (elapsed / (365 * 86_400));
    const owed = principal + interest;
    const colUsd = usdOf(collateralSym, collateralAmount);
    const borrowUsd = usdOf(borrowSym, owed);
    const hf = borrowUsd === 0 ? Infinity : (colUsd * 0.8333) / borrowUsd;
    const colForDebt = borrowUsd / (PRICE_USD[collateralSym] ?? 1);
    const bonus = colForDebt * (LIQ_BONUS_BPS / BPS);
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
    // Liquidatable position (HF < 1)
    mkRow(3, "USDC", 9_500, "EMBER", 50_000, 1120, 365),
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

const LoanCardSkeleton = () => (
  <Card className="border-border/40 bg-card/60">
    <CardContent className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-32" />
      </div>
    </CardContent>
  </Card>
);

// ── Partial liquidation simulator — calls previewPartialLiquidation when live ──
interface SimProps {
  loan: LoanRow;
  lending: Contract | null;
  onExecute: (loanId: bigint, repayAmount: number) => Promise<void>;
  pending: boolean;
}
const PartialLiquidationSimulator = ({ loan, lending, onExecute, pending }: SimProps) => {
  const [pct, setPct] = useState(50);
  const [preview, setPreview] = useState<{ effective: number; toLiq: number; refund: number } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const repayAmount = (loan.owed * pct) / 100;

  const compute = useCallback(async () => {
    setPreviewing(true);
    setPreviewError(null);
    try {
      if (lending && repayAmount > 0) {
        const repayWei = parseUnits(repayAmount.toFixed(18), 18);
        const r = await lending.previewPartialLiquidation(loan.id, repayWei);
        setPreview({
          effective: Number(formatUnits(r.effectiveRepay, 18)),
          toLiq: Number(formatUnits(r.toLiquidator, 18)),
          refund: Number(formatUnits(r.refund, 18)),
        });
      } else {
        // Local fallback: mirror contract math exactly
        const debtUsd = usdOf(loan.borrowSym, repayAmount);
        const colPrice = PRICE_USD[loan.collateralSym] ?? 1;
        const colForDebt = debtUsd / colPrice;
        const bonus = colForDebt * (LIQ_BONUS_BPS / BPS);
        let toLiq = colForDebt + bonus;
        if (toLiq > loan.collateralAmount) toLiq = loan.collateralAmount;
        const refund =
          repayAmount >= loan.owed && loan.collateralAmount > toLiq ? loan.collateralAmount - toLiq : 0;
        setPreview({ effective: Math.min(repayAmount, loan.owed), toLiq, refund });
      }
    } catch (e: any) {
      const msg = friendlyError(e);
      setPreviewError(msg);
      setPreview(null);
      toast.error("previewPartialLiquidation failed", { description: msg });
    } finally {
      setPreviewing(false);
    }
  }, [lending, loan, repayAmount]);

  // Debounced recompute on slider change
  useEffect(() => {
    const t = setTimeout(compute, 250);
    return () => clearTimeout(t);
  }, [compute]);

  return (
    <div className="rounded-md border border-border/50 bg-muted/15 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Sliders className="h-3.5 w-3.5 text-primary" /> Partial liquidation simulator
        </span>
        <Badge variant="outline" className="border-border/40 text-[10px]">
          view: previewPartialLiquidation
        </Badge>
      </div>

      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">Repay {pct}% of debt</span>
        <span className="font-mono text-foreground">
          {fmt(repayAmount, 4)} {loan.borrowSym}
        </span>
      </div>
      <Slider value={[pct]} min={1} max={100} step={1} onValueChange={(v) => setPct(v[0])} className="mb-3" />

      {previewError ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3" /> {previewError}
        </p>
      ) : previewing && !preview ? (
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : preview ? (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded border border-border/30 bg-background/40 p-2">
            <p className="text-[10px] text-muted-foreground">Effective repay</p>
            <p className="font-mono text-foreground">
              {fmt(preview.effective, 4)} {loan.borrowSym}
            </p>
          </div>
          <div className="rounded border border-border/30 bg-background/40 p-2">
            <p className="text-[10px] text-muted-foreground">You receive</p>
            <p className="font-mono text-foreground">
              {fmt(preview.toLiq, 4)} {loan.collateralSym}
            </p>
          </div>
          <div className="rounded border border-border/30 bg-background/40 p-2">
            <p className="text-[10px] text-muted-foreground">Borrower refund</p>
            <p className="font-mono text-[hsl(142,70%,50%)]">
              {fmt(preview.refund, 4)} {loan.collateralSym}
            </p>
          </div>
        </div>
      ) : null}

      <Button
        size="sm"
        disabled={pending || !preview || previewing}
        onClick={() => onExecute(loan.id, repayAmount)}
        className="mt-3 w-full bg-destructive text-destructive-foreground hover:opacity-90"
      >
        {pending ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Zap className="mr-1.5 h-3 w-3" />}
        Execute liquidation ({pct}%)
      </Button>
    </div>
  );
};

const MyLoansPanel = () => {
  const { address, connect } = useWallet();

  const [loading, setLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(!LENDING_LIVE);
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [aggHF, setAggHF] = useState<number>(Infinity);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  // Per-loan loading set (skeleton overlay during refresh of that row)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  // Per-loan tx-pending set (disables buttons + pauses auto-refresh)
  const [pendingTx, setPendingTx] = useState<Set<string>>(new Set());

  // Max-borrow simulator state
  const [collatSym, setCollatSym] = useState<string>("BLAZE");
  const [collatAmt, setCollatAmt] = useState<string>("10000");
  const [maxBorrowRows, setMaxBorrowRows] = useState<MaxBorrowRow[]>([]);

  // Stable contract instance for child simulator (read-only)
  const lendingReadRef = useRef<Contract | null>(null);
  const getLendingRead = useCallback(() => {
    if (!LENDING_LIVE || typeof window === "undefined" || !(window as any).ethereum) return null;
    if (!lendingReadRef.current) {
      const provider = new BrowserProvider((window as any).ethereum);
      lendingReadRef.current = new Contract(CONTRACTS.TWINFLAME_LENDING, LENDING_POOL_ABI, provider);
    }
    return lendingReadRef.current;
  }, []);

  // ── Loader ──
  const load = useCallback(
    async (silent = false) => {
      if (!address) return;
      if (pendingTx.size > 0) return; // pause refresh while a tx is in flight
      if (!silent) setLoading(true);
      try {
        if (!LENDING_LIVE) {
          const demo = seedDemo(address);
          setLoans(demo);
          const totBorrow = demo.reduce((s, l) => s + usdOf(l.borrowSym, l.owed), 0);
          const totCol = demo.reduce(
            (s, l) => s + usdOf(l.collateralSym, l.collateralAmount) * 0.8333,
            0,
          );
          setAggHF(totBorrow === 0 ? Infinity : totCol / totBorrow);
          setUsingFallback(true);
        } else {
          const lending = getLendingRead();
          if (!lending) throw new Error("No web3 provider available");

          let ids: bigint[];
          try {
            ids = await lending.getUserLoans(address);
          } catch (e) {
            throw new Error(`getUserLoans failed: ${friendlyError(e)}`);
          }

          // Mark all visible loans as refreshing
          setLoadingIds(new Set(ids.map((i) => i.toString())));

          const rows: LoanRow[] = [];
          for (const id of ids) {
            try {
              const L = await lending.getLoan(id);
              if (L.repaid || L.liquidated) continue;
              const owed: bigint = await lending.amountOwed(id);
              const hfE18: bigint = await lending.healthFactor(id);
              let liq = { owed: 0, toLiquidator: 0, refund: 0 };
              let liqError: string | undefined;
              try {
                const p = await lending.previewLiquidation(id);
                liq = {
                  owed: Number(formatUnits(p.owed, 18)),
                  toLiquidator: Number(formatUnits(p.toLiquidator, 18)),
                  refund: Number(formatUnits(p.refund, 18)),
                };
              } catch (e) {
                liqError = friendlyError(e);
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
                liqError,
              });
            } catch (e) {
              toast.error(`Loan #${id.toString()} fetch failed`, { description: friendlyError(e) });
            } finally {
              setLoadingIds((prev) => {
                const next = new Set(prev);
                next.delete(id.toString());
                return next;
              });
            }
          }
          setLoans(rows);
          try {
            const userHfE18: bigint = await lending.userHealthFactor(address);
            setAggHF(Number(formatUnits(userHfE18, 18)));
          } catch (e) {
            toast.error("userHealthFactor failed", { description: friendlyError(e) });
            setAggHF(Infinity);
          }
          setUsingFallback(false);
        }
        setLastRefresh(Date.now());
      } catch (e: any) {
        const msg = friendlyError(e);
        console.warn("[MyLoansPanel] fetch failed:", msg);
        toast.error("Failed to load loans", { description: msg });
        const demo = seedDemo(address);
        setLoans(demo);
        setAggHF(2.1);
        setUsingFallback(true);
      } finally {
        if (!silent) setLoading(false);
        setLoadingIds(new Set());
      }
    },
    [address, getLendingRead, pendingTx],
  );

  // Initial + auto-refresh
  useEffect(() => {
    if (!address) return;
    load();
    const t = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // ── Max-borrow preview across markets ──
  const computeMaxBorrow = useCallback(async () => {
    const amt = parseFloat(collatAmt);
    if (!amt || amt <= 0) return setMaxBorrowRows([]);
    const targets = ["BLAZE", "EMBER", "EQT", "USDC"].filter((s) => s !== collatSym);

    if (LENDING_LIVE && address) {
      try {
        const lending = getLendingRead();
        const colAddr = TOKEN_INFO[collatSym as keyof typeof TOKEN_INFO]?.address;
        const out: MaxBorrowRow[] = [];
        for (const sym of targets) {
          const tokAddr = TOKEN_INFO[sym as keyof typeof TOKEN_INFO]?.address;
          if (!colAddr || !tokAddr || !lending) continue;
          try {
            const v: bigint = await lending.maxBorrow(tokAddr, colAddr, parseUnits(String(amt), 18));
            out.push({ symbol: sym, amount: Number(formatUnits(v, 18)) });
          } catch {
            /* missing price */
          }
        }
        setMaxBorrowRows(out);
        return;
      } catch (e) {
        toast.error("maxBorrow failed", { description: friendlyError(e) });
      }
    }
    const colUsd = usdOf(collatSym, amt);
    const maxUsd = colUsd * 0.6667;
    setMaxBorrowRows(
      targets.map((sym) => ({ symbol: sym, amount: PRICE_USD[sym] ? maxUsd / PRICE_USD[sym] : 0 })),
    );
  }, [address, collatAmt, collatSym, getLendingRead]);

  useEffect(() => {
    computeMaxBorrow();
  }, [computeMaxBorrow]);

  const totals = useMemo(() => {
    const borrowUsd = loans.reduce((s, l) => s + usdOf(l.borrowSym, l.owed), 0);
    const colUsd = loans.reduce((s, l) => s + usdOf(l.collateralSym, l.collateralAmount), 0);
    return { borrowUsd, colUsd, count: loans.length };
  }, [loans]);

  // ── Tx executor: ERC20 approve → call → wait → toast each phase ──
  const runWriteTx = async (
    loanId: bigint,
    label: string,
    tokenAddr: string,
    amountWei: bigint,
    call: (lending: Contract) => Promise<any>,
  ) => {
    if (!address) return connect();
    const idStr = loanId.toString();
    setPendingTx((p) => new Set(p).add(idStr));
    const toastId = toast.loading(`${label} · preparing transaction…`);

    try {
      if (!LENDING_LIVE) {
        // Simulate the flow so the UX is testable without deployment
        await new Promise((r) => setTimeout(r, 800));
        toast.success(`${label} simulated`, {
          id: toastId,
          description: "Contract not deployed — no on-chain action taken.",
        });
        return;
      }
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const lending = new Contract(CONTRACTS.TWINFLAME_LENDING, LENDING_POOL_ABI, signer);

      // Approve if needed
      if (amountWei > 0n && tokenAddr && tokenAddr !== ZeroAddress) {
        const erc20 = new Contract(tokenAddr, ERC20_ABI, signer);
        const allowance: bigint = await erc20.allowance(address, CONTRACTS.TWINFLAME_LENDING);
        if (allowance < amountWei) {
          toast.loading(`${label} · approving token spend…`, { id: toastId });
          const ax = await erc20.approve(CONTRACTS.TWINFLAME_LENDING, amountWei);
          await ax.wait();
        }
      }

      toast.loading(`${label} · awaiting wallet confirmation…`, { id: toastId });
      const tx = await call(lending);
      toast.loading(`${label} · pending (${tx.hash.slice(0, 10)}…)`, { id: toastId });
      const receipt = await tx.wait();
      toast.success(`${label} confirmed`, {
        id: toastId,
        description: `Block ${receipt.blockNumber} · ${tx.hash.slice(0, 18)}…`,
        action: {
          label: "View",
          onClick: () => window.open(`https://polygonscan.com/tx/${tx.hash}`, "_blank"),
        },
      });
    } catch (e: any) {
      toast.error(`${label} failed`, { id: toastId, description: friendlyError(e) });
    } finally {
      setPendingTx((p) => {
        const n = new Set(p);
        n.delete(idStr);
        return n;
      });
      load(true);
    }
  };

  const handleRepay = (l: LoanRow) => {
    // Pad 0.5% headroom to cover the protocol fee (0.30%) + any micro interest accrual between sim & tx
    const pad = 1.005;
    const amountWei = parseUnits((l.owed * pad).toFixed(18), 18);
    return runWriteTx(l.id, `Repay #${l.id.toString()}`, l.borrowToken, amountWei, (lending) =>
      lending.repay(l.id),
    );
  };

  const handleFullLiquidate = (l: LoanRow) => {
    const amountWei = parseUnits((l.owed * 1.001).toFixed(18), 18);
    return runWriteTx(l.id, `Liquidate #${l.id.toString()}`, l.borrowToken, amountWei, (lending) =>
      lending["liquidate(uint256)"](l.id),
    );
  };

  const handlePartialLiquidate = async (loanId: bigint, repayAmount: number) => {
    const l = loans.find((x) => x.id === loanId);
    if (!l) return;
    const amountWei = parseUnits(repayAmount.toFixed(18), 18);
    await runWriteTx(loanId, `Partial liquidate #${loanId.toString()}`, l.borrowToken, amountWei, (lending) =>
      lending["liquidate(uint256,uint256)"](loanId, amountWei),
    );
  };

  if (!address) {
    return (
      <Card className="border-border/40 bg-gradient-to-br from-card/80 to-card/40">
        <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <Heart className="h-8 w-8 text-primary" />
          <h3 className="font-display text-base font-semibold text-foreground">Connect to view your loans</h3>
          <p className="max-w-md text-xs text-muted-foreground">
            We pull <code>getUserLoans</code>, <code>amountOwed</code>, <code>healthFactor</code>,
            <code> userHealthFactor</code>, <code>maxBorrow</code>, <code>previewLiquidation</code> and
            <code> previewPartialLiquidation</code> directly from the TwinFlame Lending contract.
          </p>
          <Button onClick={connect} className="bg-gradient-fire text-primary-foreground hover:opacity-90">
            Connect wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  const showSkeletons = loading && loans.length === 0;

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
              {pendingTx.size > 0 && (
                <Badge variant="outline" className="border-amber-400/40 text-[10px] text-amber-400">
                  {pendingTx.size} tx pending · auto-refresh paused
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {lastRefresh > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  Auto-refresh every {REFRESH_MS / 1000}s
                </span>
              )}
              <Button size="sm" variant="outline" onClick={() => load()} disabled={loading}>
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
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

          {/* Loans list */}
          {showSkeletons ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <LoanCardSkeleton key={i} />
              ))}
            </div>
          ) : loans.length === 0 ? (
            <div className="rounded-md border border-border/40 bg-muted/10 p-6 text-center">
              <p className="text-sm text-foreground">No open loans</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Borrow against collateral below to start a position.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {loans.map((l) => {
                const idStr = l.id.toString();
                const isRowLoading = loadingIds.has(idStr);
                if (isRowLoading) return <LoanCardSkeleton key={idStr} />;

                const interest = l.owed - l.principal;
                const days = (Date.now() / 1000 - l.startTime) / 86_400;
                const tier = isFinite(l.hf) ? healthFactorTier(l.hf) : "safe";
                const isPending = pendingTx.has(idStr);
                const liqPreviewFailed = !!l.liqError || (l.liq.toLiquidator === 0 && l.liq.refund === 0);

                return (
                  <motion.div key={idStr} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
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
                                #{idStr} · {l.kind} · {(l.rateBps / 100).toFixed(2)}% APR · {days.toFixed(1)}d
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

                        {/* Full-liquidation preview */}
                        <div
                          className={`rounded-md border p-3 text-xs ${
                            tier === "danger"
                              ? "border-destructive/40 bg-destructive/5"
                              : "border-border/40 bg-muted/10"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Shield className="h-3 w-3" /> previewLiquidation (full)
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
                              {l.liqError ?? "Oracle missing collateral price — preview unavailable."}
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

                        {/* Partial liquidation simulator (only when liquidatable & not borrower) */}
                        {tier === "danger" && l.borrower.toLowerCase() !== address.toLowerCase() && (
                          <PartialLiquidationSimulator
                            loan={l}
                            lending={getLendingRead()}
                            onExecute={handlePartialLiquidate}
                            pending={isPending}
                          />
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          {l.borrower.toLowerCase() === address.toLowerCase() && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleRepay(l)}
                            >
                              {isPending ? (
                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                              ) : null}
                              Repay {fmt(l.owed, 2)} {l.borrowSym}
                            </Button>
                          )}
                          {tier === "danger" && l.borrower.toLowerCase() !== address.toLowerCase() && (
                            <Button
                              size="sm"
                              disabled={isPending}
                              className="bg-destructive text-destructive-foreground hover:opacity-90"
                              onClick={() => handleFullLiquidate(l)}
                            >
                              {isPending ? (
                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                              ) : (
                                <Zap className="mr-1 h-3 w-3" />
                              )}
                              Full liquidate
                            </Button>
                          )}
                          {!usingFallback && (
                            <Button size="sm" variant="ghost" asChild className="text-muted-foreground">
                              <a
                                href={`https://polygonscan.com/address/${CONTRACTS.TWINFLAME_LENDING}#readContract`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Polygonscan <ExternalLink className="ml-1 h-3 w-3" />
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
