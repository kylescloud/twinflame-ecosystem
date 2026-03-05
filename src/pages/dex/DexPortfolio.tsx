import { motion } from "framer-motion";
import { Wallet, Shield, AlertTriangle, TrendingUp, ArrowDownUp, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";

const MOCK_SUPPLIED = [
  { symbol: "BLAZE", logo: TOKEN_LOGOS.BLAZE, amount: 12500, valueUSD: 3125, supplyAPY: 4.2, rewards: 52.5 },
  { symbol: "EMBER", logo: TOKEN_LOGOS.EMBER, amount: 45000, valueUSD: 9000, supplyAPY: 5.8, rewards: 261 },
];

const MOCK_BORROWED = [
  { symbol: "BLAZE", logo: TOKEN_LOGOS.BLAZE, amount: 3000, valueUSD: 750, borrowAPY: 8.5, interestAccrued: 21.25 },
];

const DexPortfolio = () => {
  const { address, connect, isConnecting } = useWallet();

  const totalSupplied = MOCK_SUPPLIED.reduce((s, a) => s + a.valueUSD, 0);
  const totalBorrowed = MOCK_BORROWED.reduce((s, a) => s + a.valueUSD, 0);
  const netWorth = totalSupplied - totalBorrowed;
  const healthFactor = totalBorrowed > 0 ? (totalSupplied * 0.75) / totalBorrowed : Infinity;
  const totalRewards = MOCK_SUPPLIED.reduce((s, a) => s + a.rewards, 0);

  if (!address) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Wallet className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 font-display text-2xl font-bold text-foreground">Connect Your Wallet</h2>
          <p className="mb-6 text-sm text-muted-foreground">View your positions, health factor, and rewards</p>
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
        <h1 className="font-display text-2xl font-bold text-foreground">Portfolio</h1>
      </motion.div>

      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/40 bg-card/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Net Worth</p>
            <p className="mt-1 font-display text-2xl font-bold text-foreground">${netWorth.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className={`border-border/40 bg-card/60 ${healthFactor < 1.5 ? "border-destructive/50" : ""}`}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Health Factor</p>
            <p className={`mt-1 font-display text-2xl font-bold ${
              healthFactor > 3 ? "text-[hsl(142,70%,50%)]" : healthFactor > 1.5 ? "text-amber-400" : "text-destructive"
            }`}>
              {healthFactor === Infinity ? "∞" : healthFactor.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Supplied</p>
            <p className="mt-1 font-display text-2xl font-bold text-[hsl(142,70%,50%)]">${totalSupplied.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Borrowed</p>
            <p className="mt-1 font-display text-2xl font-bold text-amber-400">${totalBorrowed.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Liquidation Risk Meter */}
      <Card className="border-border/40 bg-card/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Shield className="h-4 w-4" /> Liquidation Risk
            </div>
            <span className={`text-xs font-medium ${healthFactor > 3 ? "text-[hsl(142,70%,50%)]" : healthFactor > 1.5 ? "text-amber-400" : "text-destructive"}`}>
              {healthFactor > 3 ? "Low Risk" : healthFactor > 1.5 ? "Medium Risk" : "High Risk"}
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(5, 100 - (healthFactor / 5) * 100))}%` }}
              className={`h-full rounded-full ${healthFactor > 3 ? "bg-[hsl(142,70%,50%)]" : healthFactor > 1.5 ? "bg-amber-400" : "bg-destructive"}`}
            />
          </div>
          {healthFactor < 1.5 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              Warning: Your positions may be liquidated. Consider repaying or adding collateral.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplied Assets */}
      <Card className="border-border/40 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-[hsl(142,70%,50%)]" /> Supplied Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_SUPPLIED.map((a) => (
              <div key={a.symbol} className="flex items-center justify-between border-b border-border/20 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <img src={a.logo} alt="" className="h-8 w-8 rounded-full" />
                  <div>
                    <p className="font-semibold text-foreground">{a.amount.toLocaleString()} {a.symbol}</p>
                    <p className="text-xs text-muted-foreground">${a.valueUSD.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[hsl(142,70%,50%)]">{a.supplyAPY}% APY</p>
                  <p className="text-xs text-muted-foreground">+{a.rewards.toFixed(2)} earned</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Borrowed Assets */}
      <Card className="border-border/40 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownUp className="h-4 w-4 text-amber-400" /> Borrowed Assets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_BORROWED.map((a) => (
              <div key={a.symbol} className="flex items-center justify-between border-b border-border/20 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <img src={a.logo} alt="" className="h-8 w-8 rounded-full" />
                  <div>
                    <p className="font-semibold text-foreground">{a.amount.toLocaleString()} {a.symbol}</p>
                    <p className="text-xs text-muted-foreground">${a.valueUSD.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-amber-400">{a.borrowAPY}% APY</p>
                  <p className="text-xs text-destructive">-{a.interestAccrued.toFixed(2)} accrued</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Claim Rewards */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Gift className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Unclaimed Rewards</p>
              <p className="text-sm text-muted-foreground">{totalRewards.toFixed(2)} EMBER available</p>
            </div>
          </div>
          <Button className="bg-gradient-fire text-primary-foreground hover:opacity-90">
            Claim Rewards
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DexPortfolio;
