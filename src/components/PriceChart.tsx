import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type TimeRange = "7D" | "30D" | "90D" | "1Y";

const generatePriceData = (
  basePrice: number,
  days: number,
  volatility: number,
  trend: number
) => {
  const data = [];
  let price = basePrice * (1 - trend * 0.3);
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.45) * volatility + trend * (basePrice / days) * 0.3;
    price = Math.max(price + change, basePrice * 0.3);
    const vol = Math.floor(Math.random() * 500000 + 100000);
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: parseFloat(price.toFixed(4)),
      volume: vol,
    });
  }
  return data;
};

const RANGE_DAYS: Record<TimeRange, number> = { "7D": 7, "30D": 30, "90D": 90, "1Y": 365 };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">
        ${payload[0].value.toFixed(4)}
      </p>
      {payload[0]?.payload?.volume && (
        <p className="text-xs text-muted-foreground">
          Vol: {(payload[0].payload.volume / 1000).toFixed(0)}K
        </p>
      )}
    </div>
  );
};

interface PriceChartProps {
  token: string;
  basePrice: number;
  color: string;
  gradientId: string;
}

const PriceChart = ({ token, basePrice, color, gradientId }: PriceChartProps) => {
  const [range, setRange] = useState<TimeRange>("30D");

  const data = useMemo(
    () => generatePriceData(basePrice, RANGE_DAYS[range], basePrice * 0.06, 1.15),
    [basePrice, range]
  );

  const minPrice = Math.min(...data.map((d) => d.price));
  const maxPrice = Math.max(...data.map((d) => d.price));
  const priceChange = data.length > 1 ? data[data.length - 1].price - data[0].price : 0;
  const pctChange = data.length > 1 ? (priceChange / data[0].price) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">
            {token} Price Chart
          </CardTitle>
          <div className="flex gap-1">
            {(["7D", "30D", "90D", "1Y"] as TimeRange[]).map((r) => (
              <Button
                key={r}
                variant={range === r ? "default" : "ghost"}
                size="sm"
                className={`h-7 px-2.5 text-xs ${
                  range === r
                    ? "bg-gradient-fire text-primary-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setRange(r)}
              >
                {r}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-baseline gap-3">
            <span className="text-2xl font-bold">
              ${data[data.length - 1]?.price.toFixed(4)}
            </span>
            <span
              className={`text-sm font-semibold ${
                pctChange >= 0 ? "text-green-400" : "text-destructive"
              }`}
            >
              {pctChange >= 0 ? "+" : ""}
              {pctChange.toFixed(2)}%
            </span>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 14%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(38 5% 50%)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[minPrice * 0.95, maxPrice * 1.05]}
                  tick={{ fontSize: 10, fill: "hsl(38 5% 50%)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PriceChart;
