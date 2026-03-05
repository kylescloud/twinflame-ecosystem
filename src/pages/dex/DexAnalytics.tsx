import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Flame, Shield, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";

const TVL_DATA = Array.from({ length: 30 }, (_, i) => 8 + Math.sin(i * 0.3) * 2 + i * 0.15 + Math.random());
const VOLUME_DATA = Array.from({ length: 30 }, (_, i) => 0.5 + Math.random() * 2);
const FEE_DATA = Array.from({ length: 30 }, (_, i) => 1500 + Math.random() * 5000);

const TOP_MARKETS = [
  { symbol: "EMBER", logo: TOKEN_LOGOS.EMBER, tvl: "$8.92M", volume24h: "$620K", fees24h: "$1,860" },
  { symbol: "BLAZE", logo: TOKEN_LOGOS.BLAZE, tvl: "$2.45M", volume24h: "$340K", fees24h: "$1,020" },
  { symbol: "EQT", logo: TOKEN_LOGOS.EQT, tvl: "$1.20M", volume24h: "$85K", fees24h: "$255" },
];

const SimpleBarChart = ({ data, color = "from-primary/40 to-primary/80", height = 120 }: { data: number[]; color?: string; height?: number }) => {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t bg-gradient-to-t ${color} transition-all hover:opacity-80`}
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
};

const DexAnalytics = () => {
  return (
    <div className="space-y-6 py-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="h-7 w-7 text-primary" />
          <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">Protocol overview, volume, and revenue metrics.</p>
      </motion.div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Value Locked", value: "$12.57M", change: "+3.2%", icon: Shield, color: "text-primary" },
          { label: "24h Volume", value: "$1.82M", change: "+12.5%", icon: TrendingUp, color: "text-[hsl(142,70%,50%)]" },
          { label: "Fees Collected (24h)", value: "$5,460", change: "+8.1%", icon: DollarSign, color: "text-amber-400" },
          { label: "Total BLAZE Burned", value: "142,500", change: "—", icon: Flame, color: "text-blaze" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/40 bg-card/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  {s.change !== "—" && (
                    <span className="text-xs font-medium text-[hsl(142,70%,50%)]">{s.change}</span>
                  )}
                </div>
                <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/40 bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">TVL Over Time (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={TVL_DATA} />
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>30d ago</span><span>Today</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/40 bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Daily Volume (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={VOLUME_DATA} color="from-ember/40 to-ember/80" />
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>30d ago</span><span>Today</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Protocol Revenue (30d)</CardTitle>
            <p className="text-xs text-muted-foreground">Swap fees + lending reserve factor</p>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={FEE_DATA} color="from-equity/40 to-equity/80" height={100} />
            <div className="mt-3 grid grid-cols-3 gap-4 rounded-lg border border-border/40 bg-muted/10 p-3 text-center text-xs">
              <div>
                <p className="text-muted-foreground">50% Burned</p>
                <p className="font-semibold text-blaze">$82,350</p>
              </div>
              <div>
                <p className="text-muted-foreground">30% Rewards</p>
                <p className="font-semibold text-ember">$49,410</p>
              </div>
              <div>
                <p className="text-muted-foreground">20% EQT Dividends</p>
                <p className="font-semibold text-equity">$32,940</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Markets */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-xs text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Asset</th>
                    <th className="pb-2 text-right font-medium">TVL</th>
                    <th className="pb-2 text-right font-medium">24h Volume</th>
                    <th className="pb-2 text-right font-medium">24h Fees</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_MARKETS.map((m) => (
                    <tr key={m.symbol} className="border-b border-border/20 last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <img src={m.logo} alt="" className="h-6 w-6 rounded-full" />
                          <span className="font-semibold text-foreground">{m.symbol}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-foreground">{m.tvl}</td>
                      <td className="py-3 text-right text-foreground">{m.volume24h}</td>
                      <td className="py-3 text-right text-primary">{m.fees24h}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DexAnalytics;
