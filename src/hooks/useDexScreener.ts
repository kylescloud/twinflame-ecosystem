import { useState, useEffect, useCallback } from "react";

// DexScreener API - free, no key required
const DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex";

// Known Polygon token contract addresses for DexScreener lookups
export const POLYGON_TOKEN_ADDRESSES: Record<string, string> = {
  POL: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  USDC: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
  AAVE: "0xD6DF932A45C0f255f85145f286eA0b292B21C90B",
  LINK: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39",
  UNI: "0xb33EaAd8d922B1083446DC23f610c2567fB5180f",
  CRV: "0x172370d5Cd63279eFa6d502DAB29171933a610AF",
  SUSHI: "0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a",
  GRT: "0x5fe2B58c013d7601147DcDD68C143A77499f5531",
  SNX: "0x50B728D8D964fd00C2d0AAD81718b71311feF68a",
  COMP: "0x8505b9d2254A7Ae468c0E9dd10Ccea3A837aef5c",
  MKR: "0x6f7C932e7684666C9fd1d44527765433e01fF61d",
  BAL: "0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3",
  "1INCH": "0x9c2C5fd7b07E95EE044DDeba0E97a665F142394f",
  SAND: "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683",
  MANA: "0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4",
  GHST: "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
  APE: "0xB7b31a6BC18e48888545CE79e83E06003bE70930",
  DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
  LDO: "0xC3C7d422809852031b44ab29EEC9F1EfF2A58756",
  FET: "0x7583FEDDbceFA813dc18259940F76a02710A8905",
  RENDER: "0x61299774020dA444Af134c82fa83E3810b309991",
  QCK: "0x831753DD7087CaC61aB5644b308642cc1c33Dc13",
  STG: "0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590",
  KNC: "0x1C954E8fe737F99f68Fa1CCda3e51ebDB291948C",
  ZRX: "0x5559Edb74751A0edE9DeA4DC23aeE72cCA6bE3D5",
};

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: { m5: number; h1: number; h6: number; h24: number };
  priceChange: { m5: number; h1: number; h6: number; h24: number };
  liquidity: { usd: number; base: number; quote: number };
  fdv: number;
  pairCreatedAt?: number;
}

export interface TradeEvent {
  id: string;
  type: "buy" | "sell";
  priceUsd: number;
  amount: number;
  totalUsd: number;
  time: Date;
  txHash?: string;
  dex: string;
}

export interface PoolData {
  pair: string;
  pairAddress: string;
  dex: string;
  tvl: number;
  volume24h: number;
  apr: number;
  fee: number;
  txns24h: number;
  priceChange24h: number;
  url: string;
}

// Fetch all pairs for a token on Polygon
export function useTokenPairs(symbol: string) {
  const [pairs, setPairs] = useState<DexScreenerPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPairs = useCallback(async () => {
    const address = POLYGON_TOKEN_ADDRESSES[symbol];
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${DEXSCREENER_BASE}/tokens/${address}`);
      if (!res.ok) throw new Error(`DexScreener ${res.status}`);
      const data = await res.json();
      const polygonPairs = (data.pairs || []).filter(
        (p: DexScreenerPair) => p.chainId === "polygon"
      );
      setPairs(polygonPairs);
      setError(null);
    } catch (err: any) {
      console.warn("DexScreener pairs fetch failed:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);

  return { pairs, loading, error, refetch: fetchPairs };
}

// Derive recent trades from pair transaction data
export function deriveTrades(pairs: DexScreenerPair[], symbol: string): TradeEvent[] {
  if (!pairs.length) return [];

  // Use top pairs by liquidity to generate realistic trade feed
  const topPairs = pairs
    .filter((p) => p.liquidity?.usd > 1000)
    .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))
    .slice(0, 5);

  const trades: TradeEvent[] = [];
  const now = Date.now();

  topPairs.forEach((pair) => {
    const price = parseFloat(pair.priceUsd) || 0;
    const h1Buys = pair.txns?.h1?.buys || 0;
    const h1Sells = pair.txns?.h1?.sells || 0;
    const totalTxns = h1Buys + h1Sells;
    if (totalTxns === 0 || price === 0) return;

    const h1Volume = pair.volume?.h1 || 0;
    const avgTradeSize = totalTxns > 0 ? h1Volume / totalTxns : 100;

    // Generate trade entries from real tx counts
    for (let i = 0; i < Math.min(h1Buys, 10); i++) {
      const variation = 0.95 + Math.random() * 0.1;
      const amount = (avgTradeSize * variation) / price;
      trades.push({
        id: `${pair.pairAddress}-buy-${i}`,
        type: "buy",
        priceUsd: price * (1 + (Math.random() - 0.5) * 0.002),
        amount,
        totalUsd: amount * price,
        time: new Date(now - Math.random() * 3600000),
        dex: pair.dexId,
      });
    }

    for (let i = 0; i < Math.min(h1Sells, 10); i++) {
      const variation = 0.95 + Math.random() * 0.1;
      const amount = (avgTradeSize * variation) / price;
      trades.push({
        id: `${pair.pairAddress}-sell-${i}`,
        type: "sell",
        priceUsd: price * (1 + (Math.random() - 0.5) * 0.002),
        amount,
        totalUsd: amount * price,
        time: new Date(now - Math.random() * 3600000),
        dex: pair.dexId,
      });
    }
  });

  return trades.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 50);
}

// Derive pool data from DexScreener pairs
export function derivePools(pairs: DexScreenerPair[]): PoolData[] {
  return pairs
    .filter((p) => p.liquidity?.usd > 500)
    .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))
    .slice(0, 15)
    .map((p) => {
      const tvl = p.liquidity?.usd || 0;
      const vol24 = p.volume?.h24 || 0;
      // Estimate APR from fees: (daily volume * fee rate * 365) / TVL
      const feeRate = p.dexId.includes("uniswap") ? 0.003 : 0.003;
      const apr = tvl > 0 ? ((vol24 * feeRate * 365) / tvl) * 100 : 0;

      const dexName =
        p.dexId === "quickswap" ? "QuickSwap" :
        p.dexId === "sushiswap" ? "SushiSwap" :
        p.dexId === "uniswap" ? "Uniswap V3" :
        p.dexId === "quickswap-v3" ? "QuickSwap V3" :
        p.dexId === "balancer" ? "Balancer" :
        p.dexId.charAt(0).toUpperCase() + p.dexId.slice(1);

      return {
        pair: `${p.baseToken.symbol}/${p.quoteToken.symbol}`,
        pairAddress: p.pairAddress,
        dex: dexName,
        tvl,
        volume24h: vol24,
        apr: Math.min(apr, 999),
        fee: feeRate * 100,
        txns24h: (p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0),
        priceChange24h: p.priceChange?.h24 || 0,
        url: p.url || `https://dexscreener.com/polygon/${p.pairAddress}`,
      };
    });
}
