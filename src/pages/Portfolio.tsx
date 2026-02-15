import { motion } from "framer-motion";
import {
  Flame,
  Zap,
  Shield,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import Navbar from "@/components/Navbar";
import EmberParticles from "@/components/EmberParticles";

const MOCK_PORTFOLIO = {
  blaze: { balance: 12500, staked: 8000, price: 0.2, change24h: 3.2 },
  ember: { balance: 45000, price: 0.05, change24h: -1.1 },
  eqt: { balance: 150, price: 5.0, change24h: 0.8 },
};

const MOCK_HISTORY = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const base = 4200 + i * 45 + (Math.random() - 0.4) * 300;
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: parseFloat(base.toFixed(2)),
  };
});

const MOCK_TRANSACTIONS = [
  { type: "Stake", token: "BLAZE", amount: 2000, date: "Feb 12, 2026", icon: Flame },
  { type: "Claimed", token: "EMBER", amount: 1500, date: "Feb 10, 2026", icon: Zap },
  { type: "Buy", token: "EQT", amount: 50, date: "Feb 8, 2026", icon: Shield },
  { type: "Dividend", token: "USDC", amount: 125, date: "Jan 31, 2026", icon: ArrowUpRight },
  { type: "Buy", token: "BLAZE", amount: 5000, date: "Jan 25, 2026", icon: Flame },
];

const PIE_COLORS = [
  "hsl(25, 95%, 53%)",
  "hsl(38, 90%, 55%)",
  "hsl(200, 80%, 55%)",
];

const PortfolioTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">${payload[0].value.toLocaleString()}</p>
    </div>
  );
};

const NotConnected = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center gap-4 py-32 text-center"
  >
    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border/50 bg-muted/50">
      <Wallet className="h-10 w-10 text-muted-foreground" />
    </div>
    <h2 className="font-display text-2xl font-bold">Connect Your Wallet</h2>
    <p className="max-w-sm text-muted-foreground">
      Connect your wallet using the button in the navbar to view your TwinFlame portfolio, staking positions, and rewards history.
    </p>
  </motion.div>
);

const Portfolio = () => {
  const { address } = useWallet();

  const totalValue =
    MOCK_PORTFOLIO.blaze.balance * MOCK_PORTFOLIO.blaze.price +
    MOCK_PORTFOLIO.ember.balance * MOCK_PORTFOLIO.ember.price +
    MOCK_PORTFOLIO.eqt.balance * MOCK_PORTFOLIO.eqt.price;

  const stakedValue = MOCK_PORTFOLIO.blaze.staked * MOCK_PORTFOLIO.blaze.price;

  const pieData = [
    { name: "BLAZE", value: MOCK_PORTFOLIO.blaze.balance * MOCK_PORTFOLIO.blaze.price },
    { name: "EMBER", value: MOCK_PORTFOLIO.ember.balance * MOCK_PORTFOLIO.ember.price },
    { name: "EQT", value: MOCK_PORTFOLIO.eqt.balance * MOCK_PORTFOLIO.eqt.price },
  ];

  const holdings = [
    {
      token: "BLAZE",
      icon: Flame,
      balance: MOCK_PORTFOLIO.blaze.balance,
      staked: MOCK_PORTFOLIO.blaze.staked,
      price: MOCK_PORTFOLIO.blaze.price,
      change: MOCK_PORTFOLIO.blaze.change24h,
      colorClass: "text-primary",
      bgClass: "bg-primary/10",
    },
    {
      token: "EMBER",
      icon: Zap,
      balance: MOCK_PORTFOLIO.ember.balance,
      staked: 0,
      price: MOCK_PORTFOLIO.ember.price,
      change: MOCK_PORTFOLIO.ember.change24h,
      colorClass: "text-accent",
      bgClass: "bg-accent/10",
    },
    {
      token: "EQT",
      icon: Shield,
      balance: MOCK_PORTFOLIO.eqt.balance,
      staked: 0,
      price: MOCK_PORTFOLIO.eqt.price,
      change: MOCK_PORTFOLIO.eqt.change24h,
      colorClass: "text-[hsl(var(--equity))]",
      bgClass: "bg-[hsl(var(--equity))/0.1]",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <EmberParticles />
      <Navbar />
      <main className="container mx-auto px-6 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            <span className="text-gradient-fire">Portfolio</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Track your TwinFlame holdings and rewards
          </p>
        </motion.div>

        {!address ? (
          <NotConnected />
        ) : (
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Summary row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              {[
                {
                  label: "Total Value",
                  value: `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                  icon: BarChart3,
                  sub: "+8.4% (30d)",
                },
                {
                  label: "Staked Value",
                  value: `$${stakedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                  icon: TrendingUp,
                  sub: "8,000 BLAZE locked",
                },
                {
                  label: "Pending Rewards",
                  value: "1,245 EMBER",
                  icon: Zap,
                  sub: "≈ $62.25",
                },
              ].map((s, i) => (
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-2"
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Portfolio Value (30D)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MOCK_HISTORY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: "hsl(38 5% 50%)" }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "hsl(38 5% 50%)" }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                          />
                          <Tooltip content={<PortfolioTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(25, 95%, 53%)"
                            strokeWidth={2}
                            fill="url(#portfolioGrad)"
                            animationDuration={1500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
                  <CardHeader>
                    <CardTitle className="text-base">Allocation</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="h-[160px] w-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            dataKey="value"
                            animationDuration={1200}
                            stroke="none"
                          >
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
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: PIE_COLORS[i] }}
                            />
                            <span className="text-muted-foreground">{d.name}</span>
                          </div>
                          <span className="font-semibold">
                            {((d.value / totalValue) * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Holdings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base">Holdings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {holdings.map((h) => (
                      <div
                        key={h.token}
                        className="flex items-center justify-between rounded-lg border border-border/30 bg-background/30 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${h.bgClass}`}>
                            <h.icon className={`h-4 w-4 ${h.colorClass}`} />
                          </div>
                          <div>
                            <p className="font-semibold">{h.token}</p>
                            <p className="text-xs text-muted-foreground">
                              {h.balance.toLocaleString()} tokens
                              {h.staked > 0 && ` · ${h.staked.toLocaleString()} staked`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${(h.balance * h.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <p className={`flex items-center justify-end gap-0.5 text-xs font-medium ${h.change >= 0 ? "text-green-400" : "text-destructive"}`}>
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

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {MOCK_TRANSACTIONS.map((tx, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b border-border/20 pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50">
                            <tx.icon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{tx.type}</p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {tx.date}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold">
                          {tx.amount.toLocaleString()} {tx.token}
                        </span>
                      </div>
                    ))}
                  </div>
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
