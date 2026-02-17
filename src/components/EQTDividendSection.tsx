import { motion } from "framer-motion";
import { Shield, DollarSign, Calendar, TrendingUp, PieChart as PieIcon, BadgePercent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const EQT_TOTAL_SUPPLY = 1_000_000;
const DIVIDEND_SHARE = 0.20; // 20% of protocol revenue

interface DividendQuarter {
  quarter: string;
  protocolRevenue: number;
  dividendPool: number;
  userPayout: number;
  status: "paid" | "upcoming";
}

interface EQTDividendSectionProps {
  eqtBalance: number;
}

const EQTDividendSection = ({ eqtBalance }: EQTDividendSectionProps) => {
  const ownershipPct = EQT_TOTAL_SUPPLY > 0 ? (eqtBalance / EQT_TOTAL_SUPPLY) * 100 : 0;

  // Placeholder quarterly data — will be replaced with on-chain data
  const quarterlyHistory: DividendQuarter[] = [
    { quarter: "Q4 2025", protocolRevenue: 0, dividendPool: 0, userPayout: 0, status: "upcoming" },
    { quarter: "Q3 2025", protocolRevenue: 0, dividendPool: 0, userPayout: 0, status: "upcoming" },
  ];

  const totalPaidOut = quarterlyHistory
    .filter((q) => q.status === "paid")
    .reduce((sum, q) => sum + q.userPayout, 0);

  // Simulated projection based on hypothetical $100k quarterly protocol revenue
  const projectedQuarterlyRevenue = 100_000;
  const projectedDividendPool = projectedQuarterlyRevenue * DIVIDEND_SHARE;
  const projectedUserPayout = projectedDividendPool * (ownershipPct / 100);

  const statCards = [
    {
      label: "Your EQT Holdings",
      value: eqtBalance.toLocaleString(),
      sub: "tokens held",
      icon: Shield,
    },
    {
      label: "Ownership Stake",
      value: `${ownershipPct.toFixed(4)}%`,
      sub: `of ${EQT_TOTAL_SUPPLY.toLocaleString()} total supply`,
      icon: PieIcon,
    },
    {
      label: "Your Dividend Share",
      value: `${(ownershipPct * DIVIDEND_SHARE).toFixed(4)}%`,
      sub: "of gross protocol revenue",
      icon: BadgePercent,
    },
    {
      label: "Total USDC Received",
      value: `$${totalPaidOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      sub: "lifetime dividends",
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      {/* EQT Ownership & Dividend Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-[hsl(var(--equity))]" />
              EQT Equity Position & Dividends
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((s, i) => (
                <div key={i} className="rounded-lg border border-border/30 bg-background/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--equity))]/10">
                      <s.icon className="h-4 w-4 text-[hsl(var(--equity))]" />
                    </div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Ownership bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Protocol Ownership</span>
                <span className="font-semibold">{ownershipPct.toFixed(4)}%</span>
              </div>
              <Progress value={Math.min(ownershipPct, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                You own {eqtBalance.toLocaleString()} of {EQT_TOTAL_SUPPLY.toLocaleString()} EQT tokens, entitling you to {(ownershipPct * DIVIDEND_SHARE).toFixed(4)}% of all gross protocol revenue distributed as quarterly USDC dividends.
              </p>
            </div>

            {/* Projected earnings */}
            {eqtBalance > 0 && (
              <div className="rounded-lg border border-[hsl(var(--equity))]/20 bg-[hsl(var(--equity))]/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-[hsl(var(--equity))]" />
                  <p className="text-sm font-semibold">Projected Quarterly Earnings</p>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  Based on a hypothetical ${projectedQuarterlyRevenue.toLocaleString()} quarterly protocol revenue:
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[hsl(var(--equity))]">
                    ${projectedUserPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-muted-foreground">USDC per quarter</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Total dividend pool: ${projectedDividendPool.toLocaleString()} (20% of revenue) · Your share: {ownershipPct.toFixed(4)}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quarterly Dividend History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-[hsl(var(--equity))]" />
              Quarterly USDC Dividend History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quarterlyHistory.length > 0 ? (
              <div className="space-y-1">
                {/* Table header */}
                <div className="grid grid-cols-5 gap-2 rounded-lg bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
                  <span>Quarter</span>
                  <span className="text-right">Protocol Revenue</span>
                  <span className="text-right">Dividend Pool (20%)</span>
                  <span className="text-right">Your Payout</span>
                  <span className="text-right">Status</span>
                </div>
                {quarterlyHistory.map((q, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-center rounded-lg border border-border/20 bg-background/30 px-4 py-3 text-sm">
                    <span className="font-semibold">{q.quarter}</span>
                    <span className="text-right text-muted-foreground">
                      ${q.protocolRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-right text-muted-foreground">
                      ${q.dividendPool.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-right font-semibold">
                      ${q.userPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-right">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        q.status === "paid"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/50 text-muted-foreground"
                      }`}>
                        {q.status === "paid" ? "Paid" : "Upcoming"}
                      </span>
                    </span>
                  </div>
                ))}
                {/* Totals */}
                <div className="grid grid-cols-5 gap-2 rounded-lg border border-[hsl(var(--equity))]/20 bg-[hsl(var(--equity))]/5 px-4 py-3 text-sm font-semibold mt-2">
                  <span>Total Paid</span>
                  <span className="text-right">—</span>
                  <span className="text-right">—</span>
                  <span className="text-right text-[hsl(var(--equity))]">
                    ${totalPaidOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-right text-xs font-medium text-muted-foreground">USDC</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No dividend history yet</p>
                <p className="text-xs text-muted-foreground">
                  Quarterly USDC payouts will appear here after the first distribution (Q4 2025).
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default EQTDividendSection;
