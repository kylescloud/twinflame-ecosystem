import { motion } from "framer-motion";
import {
  Flame, Zap, Shield, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight,
  Clock, BarChart3, Copy, ExternalLink, Check,
} from "lucide-react";
import { useState } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import Navbar from "@/components/Navbar";
import EmberParticles from "@/components/EmberParticles";
import { useToast } from "@/hooks/use-toast";
import EQTDividendSection from "@/components/EQTDividendSection";

// Placeholder contract addresses — replace with real deployed addresses
const CONTRACT_ADDRESSES: Record<string, string> = {
  BLAZE: "0x0000000000000000000000000000000000000001",
  EMBER: "0x0000000000000000000000000000000000000002",
  EQT: "0x0000000000000000000000000000000000000003",
};

const getPolygonscanTokenUrl = (contract: string) =>
  `https://polygonscan.com/token/${contract}`;

const getPolygonscanTxUrl = (txHash: string) =>
  `https://polygonscan.com/tx/${txHash}`;

export interface PortfolioTransaction {
  type: string;
  token: string;
  amount: number;
  date: string;
  txHash: string;
  icon: typeof Flame;
}

const PIE_COLORS = ["hsl(25, 95%, 53%)", "hsl(38, 90%, 55%)", "hsl(200, 80%, 55%)"];

const PortfolioTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">${payload[0].value.toLocaleString()}</p>
    </div>
  );
};

const NotConnected = ({ onConnect, isConnecting }: { onConnect: () => void; isConnecting: boolean }) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6 py-32 text-center">
    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border/50 bg-muted/50">
      <Wallet className="h-10 w-10 text-muted-foreground" />
    </div>
    <div>
      <h2 className="font-display text-2xl font-bold">Connect Your Wallet</h2>
      <p className="mt-2 max-w-sm text-muted-foreground">Connect your wallet to view your TwinFlame portfolio, staking positions, and rewards history.</p>
    </div>
    <Button onClick={onConnect} disabled={isConnecting} className="bg-gradient-fire text-primary-foreground hover:opacity-90" size="lg">
      <Wallet className="mr-2 h-4 w-4" />
      {isConnecting ? "Connecting…" : "Connect Wallet"}
    </Button>
  </motion.div>
);

const Portfolio = () => {
  const { address, shortAddress, balance, connect, disconnect, isConnecting } = useWallet();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [transactions] = useState<PortfolioTransaction[]>([]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast({ title: "Address Copied", description: address });
    setTimeout(() => setCopied(false), 2000);
  };

  // Until smart contracts are connected, balances default to 0
  const tokenData = {
    BLAZE: { balance: 0, staked: 0, price: 0, change24h: 0 },
    EMBER: { balance: 0, price: 0, change24h: 0 },
    EQT: { balance: 0, price: 0, change24h: 0 },
  };

  const totalValue =
    tokenData.BLAZE.balance * tokenData.BLAZE.price +
    tokenData.EMBER.balance * tokenData.EMBER.price +
    tokenData.EQT.balance * tokenData.EQT.price;

  const stakedValue = tokenData.BLAZE.staked * tokenData.BLAZE.price;

  const pieData = [
    { name: "BLAZE", value: tokenData.BLAZE.balance * tokenData.BLAZE.price },
    { name: "EMBER", value: tokenData.EMBER.balance * tokenData.EMBER.price },
    { name: "EQT", value: tokenData.EQT.balance * tokenData.EQT.price },
  ];

  const holdings = [
    { token: "BLAZE", icon: Flame, balance: tokenData.BLAZE.balance, staked: tokenData.BLAZE.staked, price: tokenData.BLAZE.price, change: tokenData.BLAZE.change24h, colorClass: "text-primary", bgClass: "bg-primary/10" },
    { token: "EMBER", icon: Zap, balance: tokenData.EMBER.balance, staked: 0, price: tokenData.EMBER.price, change: tokenData.EMBER.change24h, colorClass: "text-accent", bgClass: "bg-accent/10" },
    { token: "EQT", icon: Shield, balance: tokenData.EQT.balance, staked: 0, price: tokenData.EQT.price, change: tokenData.EQT.change24h, colorClass: "text-[hsl(var(--equity))]", bgClass: "bg-[hsl(var(--equity))/0.1]" },
  ];

  const summaryCards = [
    { label: "Total Value", value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: BarChart3, sub: "Connect contracts to sync" },
    { label: "Staked Value", value: `$${stakedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: TrendingUp, sub: `${tokenData.BLAZE.staked.toLocaleString()} BLAZE locked` },
    { label: "Pending Rewards", value: "0 EMBER", icon: Zap, sub: "≈ $0.00" },
  ];

  // Empty history until on-chain data is connected
  const historyData: { date: string; value: number }[] = [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <EmberParticles />
      <Navbar />
      <main className="container mx-auto px-6 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            <span className="text-gradient-fire">Portfolio</span>
          </h1>
          <p className="mt-3 text-muted-foreground">Track your TwinFlame holdings and rewards</p>
        </motion.div>

        {!address ? (
          <NotConnected onConnect={connect} isConnecting={isConnecting} />
        ) : (
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Wallet Banner */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-primary/20 bg-card/80 backdrop-blur-sm glow-fire">
                <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-fire">
                      <Wallet className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Connected Wallet</p>
                      <div className="flex items-center gap-2">
                        <p className="font-display text-lg font-bold text-foreground">{shortAddress}</p>
                        <button onClick={copyAddress} className="text-muted-foreground hover:text-foreground transition-colors">
                          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <a href={`https://polygonscan.com/address/${address}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      {balance && <p className="mt-0.5 text-xs text-muted-foreground">{balance} MATIC</p>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={disconnect} className="border-destructive/30 text-destructive hover:bg-destructive/10">
                    Disconnect
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Summary row */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {summaryCards.map((s, i) => (
                <Card key={i} className="border-border/30 bg-card/50 backdrop-blur-sm">
                  <CardContent className="flex items-center gap-3 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-lg font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.sub}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Chart + Allocation */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader><CardTitle className="text-base">Portfolio Value (30D)</CardTitle></CardHeader>
                  <CardContent>
                    {historyData.length > 0 ? (
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(38 5% 50%)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10, fill: "hsl(38 5% 50%)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                            <Tooltip content={<PortfolioTooltip />} />
                            <Area type="monotone" dataKey="value" stroke="hsl(25, 95%, 53%)" strokeWidth={2} fill="url(#portfolioGrad)" animationDuration={1500} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                        No portfolio history yet — data will populate once contracts are connected.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
                  <CardHeader><CardTitle className="text-base">Allocation</CardTitle></CardHeader>
                  <CardContent className="flex flex-col items-center">
                    {totalValue > 0 ? (
                      <>
                        <div className="h-[160px] w-[160px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" animationDuration={1200} stroke="none">
                                {pieData.map((_, i) => (
                                  <Cell key={i} fill={PIE_COLORS[i]} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 w-full">
                          {pieData.map((d, i) => (
                            <div key={d.name} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                                <span className="text-muted-foreground">{d.name}</span>
                              </div>
                              <span className="font-semibold">{((d.value / totalValue) * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground text-center">
                        No tokens held yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Holdings with Polygonscan contract links */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader><CardTitle className="text-base">Holdings</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {holdings.map((h) => (
                      <div key={h.token} className="flex items-center justify-between rounded-lg border border-border/30 bg-background/30 p-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${h.bgClass}`}>
                            <h.icon className={`h-4 w-4 ${h.colorClass}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold">{h.token}</p>
                              <a
                                href={getPolygonscanTokenUrl(CONTRACT_ADDRESSES[h.token])}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                title={`View ${h.token} contract on Polygonscan`}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {h.balance.toLocaleString()} tokens{h.staked > 0 && ` · ${h.staked.toLocaleString()} staked`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${(h.balance * h.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                          <p className={`flex items-center justify-end gap-0.5 text-xs font-medium ${h.change >= 0 ? "text-primary" : "text-destructive"}`}>
                            {h.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(h.change)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* EQT Dividend Sections */}
            <EQTDividendSection eqtBalance={tokenData.EQT.balance} />

            {/* Recent Transactions — linked to Polygonscan */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.map((tx, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-border/20 pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50">
                              <tx.icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{tx.type}</p>
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />{tx.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{tx.amount.toLocaleString()} {tx.token}</span>
                            <a
                              href={getPolygonscanTxUrl(tx.txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title="View on Polygonscan"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <Clock className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No transactions yet</p>
                      <p className="text-xs text-muted-foreground">Your on-chain activity will appear here once you start trading.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Portfolio;
