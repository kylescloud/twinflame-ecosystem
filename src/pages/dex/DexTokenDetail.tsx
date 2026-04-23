import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, ExternalLink, Copy, TrendingUp, TrendingDown,
  BarChart3, Droplets, Clock, Globe, FileText, Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TOKEN_LOGOS } from "@/lib/tokenAssets";
import { usePolygonMarketData, COINGECKO_IDS, type LiveCoinData } from "@/hooks/usePolygonMarketData";

// Known contract addresses on Polygon
const POLYGON_CONTRACTS: Record<string, { token: string; pool?: string }> = {
  POL: { token: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", pool: "0xa374094527e1673A86dE625aa7d6ee0288b39B71" },
  WETH: { token: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", pool: "0xadbF1854e5883eB8aa7BAf50705338739e558E5b" },
  USDC: { token: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", pool: "0xA374094527E1673A86dE625aa7D6ee0288B39b72" },
  USDT: { token: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", pool: "0x604229c960e5CACF2aaEAc8Be68Ac07BA9DF81c3" },
  WBTC: { token: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", pool: "0xf6a637525402643B0654a54bEAd2Cb9A83C8B498" },
  AAVE: { token: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B", pool: "0x90bc3E68Ba8C1678610E75EBcE9b7115deE25379" },
  LINK: { token: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", pool: "0x5cA6Ca6cF4ADFbd2c67c282Db48e4B9143aeBbd2" },
  UNI: { token: "0xb33EaAd8d922B1083446DC23f610c2567fB5180f" },
  CRV: { token: "0x172370d5Cd63279eFa6d502DAB29171933a610AF" },
  SUSHI: { token: "0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a" },
  GRT: { token: "0x5fe2B58c013d7601147DcDD68C143A77499f5531" },
  SNX: { token: "0x50B728D8D964fd00C2d0AAD81718b71311feF68a" },
  COMP: { token: "0x8505b9d2254A7Ae468c0E9dd10Ccea3A837aef5c" },
  MKR: { token: "0x6f7C932e7684666C9fd1d44527765433e01fF61d" },
  BAL: { token: "0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3" },
  "1INCH": { token: "0x9c2C5fd7b07E95EE044DDeba0E97a665F142394f" },
  SAND: { token: "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683" },
  MANA: { token: "0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4" },
  GHST: { token: "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7" },
  APE: { token: "0xB7b31a6BC18e48888545CE79e83E06003bE70930" },
};

// Simulated recent trades
const generateTrades = (symbol: string, price: number) => {
  const types = ["buy", "sell"] as const;
  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    type: types[Math.floor(Math.random() * 2)],
    price: price * (1 + (Math.random() - 0.5) * 0.005),
    amount: Math.random() * (price > 100 ? 5 : 5000),
    total: 0,
    time: new Date(Date.now() - i * 30000 - Math.random() * 60000),
  })).map(t => ({ ...t, total: t.price * t.amount }));
};

// Simulated liquidity pools
const generatePools = (symbol: string) => [
  { pair: `${symbol}/USDC`, tvl: Math.random() * 5000000 + 500000, apr: Math.random() * 15 + 2, volume24h: Math.random() * 2000000, fee: 0.3, dex: "QuickSwap" },
  { pair: `${symbol}/WETH`, tvl: Math.random() * 3000000 + 200000, apr: Math.random() * 20 + 5, volume24h: Math.random() * 1500000, fee: 0.3, dex: "SushiSwap" },
  { pair: `${symbol}/POL`, tvl: Math.random() * 1000000 + 100000, apr: Math.random() * 25 + 8, volume24h: Math.random() * 800000, fee: 0.05, dex: "UniswapV3" },
];

const TIME_RANGES = ["1H", "1D", "1W", "1M", "3M", "1Y"] as const;

const formatPrice = (p: number) => {
  if (p >= 1000) return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(6);
};

const formatNum = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

const DexTokenDetail = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { coins, isLive } = usePolygonMarketData();
  const { toast } = useToast();
  const [chartRange, setChartRange] = useState<typeof TIME_RANGES[number]>("1W");

  const symbol = tokenId?.toUpperCase() || "";

  // Find from live data or build from native tokens
  const coin = useMemo((): LiveCoinData | null => {
    const cgId = COINGECKO_IDS[symbol];
    if (cgId) {
      const found = coins.find(c => c.id === cgId);
      if (found) return found;
    }
    // Native tokens
    const natives: Record<string, Partial<LiveCoinData>> = {
      BLAZE: { id: "blaze", symbol: "blaze", name: "TwinFlame BLAZE", image: TOKEN_LOGOS.BLAZE, current_price: 0.25, price_change_percentage_24h: 12.5, market_cap: 25000000, total_volume: 3400000, market_cap_rank: 999, circulating_supply: 100000000, total_supply: 1000000000, high_24h: 0.27, low_24h: 0.22, ath: 0.45, ath_date: "2025-12-15", atl: 0.01, atl_date: "2024-06-01" },
      EMBER: { id: "ember", symbol: "ember", name: "TwinFlame EMBER", image: TOKEN_LOGOS.EMBER, current_price: 0.20, price_change_percentage_24h: 8.7, market_cap: 20000000, total_volume: 2800000, market_cap_rank: 999, circulating_supply: 100000000, total_supply: 500000000, high_24h: 0.22, low_24h: 0.18, ath: 0.38, ath_date: "2025-11-20", atl: 0.005, atl_date: "2024-06-01" },
      EQT: { id: "eqt", symbol: "eqt", name: "TwinFlame Equity", image: TOKEN_LOGOS.EQT, current_price: 2.50, price_change_percentage_24h: -2.1, market_cap: 12500000, total_volume: 850000, market_cap_rank: 999, circulating_supply: 5000000, total_supply: 10000000, high_24h: 2.65, low_24h: 2.40, ath: 5.00, ath_date: "2025-09-01", atl: 0.50, atl_date: "2024-08-15" },
    };
    return (natives[symbol] as LiveCoinData) || null;
  }, [coins, symbol]);

  const contracts = POLYGON_CONTRACTS[symbol];
  const trades = useMemo(() => coin ? generateTrades(symbol, coin.current_price) : [], [coin, symbol]);
  const pools = useMemo(() => generatePools(symbol), [symbol]);

  // Sparkline chart data
  const chartData = useMemo(() => {
    if (!coin?.sparkline_in_7d?.price) {
      // Generate synthetic data
      const base = coin?.current_price || 1;
      return Array.from({ length: 168 }, (_, i) => base * (1 + (Math.random() - 0.48) * 0.03 * Math.sin(i / 10)));
    }
    const prices = coin.sparkline_in_7d.price;
    switch (chartRange) {
      case "1H": return prices.slice(-4);
      case "1D": return prices.slice(-24);
      case "1W": return prices;
      case "1M": return prices;
      case "3M": return prices;
      case "1Y": return prices;
      default: return prices;
    }
  }, [coin, chartRange]);

  const copyAddr = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast({ title: "Copied!", description: addr.slice(0, 20) + "…" });
  };

  if (!coin) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Token not found</p>
        <Link to="/dex/market" className="mt-4 inline-block text-primary underline">← Back to Market</Link>
      </div>
    );
  }

  const price = coin.current_price ?? 0;
  const change = coin.price_change_percentage_24h ?? 0;
  const isPositive = change >= 0;

  // Chart SVG
  const chartMin = Math.min(...chartData);
  const chartMax = Math.max(...chartData);
  const chartH = 200;
  const chartW = 800;
  const chartRange2 = chartMax - chartMin || 1;
  const pathD = chartData.map((v, i) => {
    const x = (i / (chartData.length - 1)) * chartW;
    const y = chartH - ((v - chartMin) / chartRange2) * (chartH - 20) - 10;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");
  const gradientD = `${pathD} L${chartW},${chartH} L0,${chartH} Z`;

  return (
    <div className="space-y-6 py-4">
      {/* Back nav */}
      <Link to="/dex/market" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Market
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <img src={coin.image} alt="" className="h-12 w-12 rounded-full" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-foreground">{coin.name}</h1>
              <span className="rounded-md bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">{symbol}</span>
              {coin.market_cap_rank && coin.market_cap_rank < 500 && (
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">#{coin.market_cap_rank}</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-3xl font-bold text-foreground tabular-nums">${formatPrice(price)}</span>
              <span className={`flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold ${isPositive ? "bg-[hsl(142,70%,50%)]/10 text-[hsl(142,70%,50%)]" : "bg-destructive/10 text-destructive"}`}>
                {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {isPositive ? "+" : ""}{change.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/dex/trade">
            <Button className="bg-gradient-fire text-primary-foreground hover:opacity-90">
              Swap {symbol}
            </Button>
          </Link>
          <Link to="/dex/lend">
            <Button variant="outline">Lend / Borrow</Button>
          </Link>
        </div>
      </motion.div>

      {/* Price Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border/40 bg-card/60">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-muted-foreground" /> Price History
              </h3>
              <div className="flex gap-1">
                {TIME_RANGES.map(r => (
                  <button key={r} onClick={() => setChartRange(r)}
                    className={`rounded-md px-2 py-1 text-[10px] font-medium transition-all ${chartRange === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-48 sm:h-56">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? "hsl(142,70%,50%)" : "hsl(0,70%,50%)"} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={isPositive ? "hsl(142,70%,50%)" : "hsl(0,70%,50%)"} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={gradientD} fill="url(#chartGradient)" />
                <path d={pathD} fill="none" stroke={isPositive ? "hsl(142,70%,50%)" : "hsl(0,70%,50%)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute bottom-2 left-3 flex gap-4 text-[10px] text-muted-foreground">
                <span>L: ${formatPrice(chartMin)}</span>
                <span>H: ${formatPrice(chartMax)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Market Cap", value: formatNum(coin.market_cap ?? 0) },
          { label: "24h Volume", value: formatNum(coin.total_volume ?? 0) },
          { label: "24h High", value: `$${formatPrice(coin.high_24h ?? price)}` },
          { label: "24h Low", value: `$${formatPrice(coin.low_24h ?? price)}` },
          { label: "Circulating Supply", value: (coin.circulating_supply ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) },
          { label: "Total Supply", value: (coin.total_supply ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 }) },
          { label: "All-Time High", value: `$${formatPrice(coin.ath ?? price)}` },
          { label: "All-Time Low", value: `$${formatPrice(coin.atl ?? 0)}` },
        ].map(s => (
          <Card key={s.label} className="border-border/40 bg-card/60">
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 font-display text-sm font-bold text-foreground tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed Content: Trades, Pools, Info */}
      <Tabs defaultValue="trades">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="trades" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Clock className="mr-1 h-3 w-3" /> Recent Trades
          </TabsTrigger>
          <TabsTrigger value="pools" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Droplets className="mr-1 h-3 w-3" /> Liquidity Pools
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="mr-1 h-3 w-3" /> Token Info
          </TabsTrigger>
        </TabsList>

        {/* Recent Trades */}
        <TabsContent value="trades" className="mt-4">
          <Card className="border-border/40 bg-card/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="px-3 py-2 text-left text-muted-foreground font-medium">Type</th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">Price</th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">Amount</th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">Total</th>
                    <th className="px-3 py-2 text-right text-muted-foreground font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map(t => (
                    <tr key={t.id} className="border-b border-border/10 hover:bg-muted/10">
                      <td className={`px-3 py-2 font-semibold ${t.type === "buy" ? "text-[hsl(142,70%,50%)]" : "text-destructive"}`}>
                        {t.type.toUpperCase()}
                      </td>
                      <td className="px-3 py-2 text-right text-foreground tabular-nums">${formatPrice(t.price)}</td>
                      <td className="px-3 py-2 text-right text-foreground tabular-nums">{t.amount.toFixed(4)}</td>
                      <td className="px-3 py-2 text-right text-foreground tabular-nums">${t.total.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{t.time.toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Liquidity Pools */}
        <TabsContent value="pools" className="mt-4">
          <div className="space-y-3">
            {pools.map((pool, i) => (
              <Card key={i} className="border-border/40 bg-card/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground text-sm">{pool.pair}</span>
                      <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">{pool.dex}</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{pool.fee}% fee</span>
                    </div>
                    <Link to="/dex/trade">
                      <Button size="sm" variant="outline" className="h-7 text-[10px]">Add Liquidity</Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-muted-foreground">TVL</p>
                      <p className="font-semibold text-foreground">{formatNum(pool.tvl)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">APR</p>
                      <p className="font-semibold text-[hsl(142,70%,50%)]">{pool.apr.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">24h Volume</p>
                      <p className="font-semibold text-foreground">{formatNum(pool.volume24h)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Token Info */}
        <TabsContent value="info" className="mt-4">
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-4 space-y-4">
              {/* Description */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-muted-foreground" /> About {coin.name}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {coin.name} ({symbol}) is a token available on the Polygon network ecosystem.
                  {symbol === "BLAZE" && " BLAZE is the governance and utility token of the TwinFlame DeFi protocol, powering swaps, lending, and staking with a deflationary burn mechanism."}
                  {symbol === "EMBER" && " EMBER is the reward and fee token of TwinFlame, distributed to liquidity providers and stakers. It captures protocol revenue through buy-back and burn."}
                  {symbol === "EQT" && " EQT (TwinFlame Equity Token) represents ownership in the TwinFlame protocol treasury. Holders receive dividend distributions and governance voting rights."}
                  {symbol === "POL" && " POL (formerly MATIC) is the native gas token of the Polygon network, used for transaction fees and staking to secure the network."}
                  {symbol === "WETH" && " Wrapped Ether on Polygon represents ETH bridged to Polygon for use in DeFi protocols, DEX trading, and as collateral."}
                  {symbol === "AAVE" && " Aave is a leading decentralized lending protocol deployed on Polygon, enabling users to lend and borrow crypto assets."}
                  {symbol === "LINK" && " Chainlink provides decentralized oracle services, feeding real-world data to smart contracts across Polygon and other networks."}
                  {!["BLAZE", "EMBER", "EQT", "POL", "WETH", "AAVE", "LINK"].includes(symbol) && ` It is actively traded on Polygon DEXs and available for swapping and lending on TwinFlame.`}
                </p>
              </div>

              {/* Contract Addresses */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-muted-foreground" /> Contract Addresses
                </h4>
                <div className="space-y-2">
                  {contracts?.token && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/20 p-2.5">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Token Contract (Polygon)</p>
                        <p className="text-xs text-foreground font-mono">{contracts.token.slice(0, 6)}…{contracts.token.slice(-4)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => copyAddr(contracts.token)} className="rounded p-1 hover:bg-muted/40">
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <a href={`https://polygonscan.com/token/${contracts.token}`} target="_blank" rel="noopener noreferrer" className="rounded p-1 hover:bg-muted/40">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      </div>
                    </div>
                  )}
                  {contracts?.pool && (
                    <div className="flex items-center justify-between rounded-lg bg-muted/20 p-2.5">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Primary Pool Address</p>
                        <p className="text-xs text-foreground font-mono">{contracts.pool.slice(0, 6)}…{contracts.pool.slice(-4)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => copyAddr(contracts.pool!)} className="rounded p-1 hover:bg-muted/40">
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <a href={`https://polygonscan.com/address/${contracts.pool}`} target="_blank" rel="noopener noreferrer" className="rounded p-1 hover:bg-muted/40">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </a>
                      </div>
                    </div>
                  )}
                  {!contracts && (
                    <p className="text-xs text-muted-foreground italic">Contract address not indexed yet for this token.</p>
                  )}
                </div>
              </div>

              {/* Links */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Resources</h4>
                <div className="flex flex-wrap gap-2">
                  {contracts?.token && (
                    <a href={`https://polygonscan.com/token/${contracts.token}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-muted/20 px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="h-3 w-3" /> PolygonScan
                    </a>
                  )}
                  <a href={`https://www.coingecko.com/en/coins/${COINGECKO_IDS[symbol] || symbol.toLowerCase()}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-muted/20 px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-3 w-3" /> CoinGecko
                  </a>
                  <a href={`https://dexscreener.com/polygon/${contracts?.token || ""}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-muted/20 px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="h-3 w-3" /> DexScreener
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DexTokenDetail;
