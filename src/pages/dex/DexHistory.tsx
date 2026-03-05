import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, ArrowDownUp, TrendingUp, Landmark, AlertTriangle, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { Wallet } from "lucide-react";

const MOCK_HISTORY = [
  { id: "0x8a3f1b2c", type: "swap" as const, details: "BLAZE → EMBER", amount: "1,000 BLAZE", result: "1,046.85 EMBER", fee: "3.15 EMBER", date: new Date(Date.now() - 3600000) },
  { id: "0x7c2d9e4a", type: "supply" as const, details: "Supply EMBER", amount: "5,000 EMBER", result: "+5.8% APY", fee: "15 EMBER", date: new Date(Date.now() - 7200000) },
  { id: "0x5f1a8b3d", type: "borrow" as const, details: "Borrow BLAZE", amount: "2,000 BLAZE", result: "8.5% APY", fee: "6 BLAZE", date: new Date(Date.now() - 14400000) },
  { id: "0x9e4c7b2f", type: "swap" as const, details: "EQT → BLAZE", amount: "100 EQT", result: "997 BLAZE", fee: "3 BLAZE", date: new Date(Date.now() - 86400000) },
  { id: "0x3a7d1e8c", type: "repay" as const, details: "Repay BLAZE Loan", amount: "2,017 BLAZE", result: "Loan Closed", fee: "6 BLAZE", date: new Date(Date.now() - 172800000) },
  { id: "0x2b6c4f9a", type: "swap" as const, details: "EMBER → EQT", amount: "10,000 EMBER", result: "94,715 EQT", fee: "285 EQT", date: new Date(Date.now() - 259200000) },
];

const TYPE_CONFIG = {
  swap: { icon: ArrowDownUp, color: "text-primary", bg: "bg-primary/10", label: "Swap" },
  supply: { icon: TrendingUp, color: "text-[hsl(142,70%,50%)]", bg: "bg-[hsl(142,70%,50%)]/10", label: "Supply" },
  borrow: { icon: Landmark, color: "text-amber-400", bg: "bg-amber-400/10", label: "Borrow" },
  repay: { icon: Landmark, color: "text-equity", bg: "bg-equity/10", label: "Repay" },
  liquidation: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", label: "Liquidation" },
};

const FILTER_TYPES = ["All", "Swaps", "Supply", "Borrow", "Repay"];

const timeAgo = (d: Date) => {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const DexHistory = () => {
  const { address, connect, isConnecting } = useWallet();
  const [filter, setFilter] = useState("All");

  const filtered = MOCK_HISTORY.filter((tx) => {
    if (filter === "All") return true;
    return filter.toLowerCase().startsWith(tx.type);
  });

  const handleExport = () => {
    const csv = "ID,Type,Details,Amount,Result,Fee,Date\n" +
      MOCK_HISTORY.map((tx) => `${tx.id},${tx.type},${tx.details},${tx.amount},${tx.result},${tx.fee},${tx.date.toISOString()}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "twinflame-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!address) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 font-display text-2xl font-bold text-foreground">Transaction History</h2>
          <p className="mb-6 text-sm text-muted-foreground">Connect your wallet to view your transaction history</p>
          <Button onClick={connect} disabled={isConnecting} className="bg-gradient-fire text-primary-foreground" size="lg">
            <Wallet className="mr-2 h-4 w-4" />
            {isConnecting ? "Connecting…" : "Connect Wallet"}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Transaction History</h1>
            <p className="mt-1 text-sm text-muted-foreground">All your swaps, supplies, borrows, and repayments</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-1.5">
        {FILTER_TYPES.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === f ? "bg-primary text-primary-foreground" : "border border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Transactions */}
      <Card className="border-border/40 bg-card/60">
        <CardContent className="p-0">
          <div className="divide-y divide-border/20">
            {filtered.map((tx, i) => {
              const cfg = TYPE_CONFIG[tx.type];
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-muted/10"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${cfg.bg}`}>
                      <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{tx.details}</p>
                        <span className={`rounded-full ${cfg.bg} px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {timeAgo(tx.date)} • <span className="font-mono">{tx.id}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{tx.result}</p>
                    <p className="text-[10px] text-muted-foreground">Fee: {tx.fee}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DexHistory;
