import { useState, useEffect, useCallback, useRef } from "react";

// 100+ Polygon ecosystem tokens mapped to CoinGecko IDs
export const COINGECKO_IDS: Record<string, string> = {
  POL: "matic-network",
  WETH: "weth",
  USDC: "usd-coin",
  USDT: "tether",
  WBTC: "wrapped-bitcoin",
  AAVE: "aave",
  LINK: "chainlink",
  UNI: "uniswap",
  CRV: "curve-dao-token",
  SUSHI: "sushi",
  GRT: "the-graph",
  SNX: "havven",
  COMP: "compound-governance-token",
  MKR: "maker",
  BAL: "balancer",
  "1INCH": "1inch",
  DYDX: "dydx",
  LDO: "lido-dao",
  RPL: "rocket-pool",
  FXS: "frax-share",
  QCK: "quickswap",
  STG: "stargate-finance",
  GHST: "aavegotchi",
  SAND: "the-sandbox",
  MANA: "decentraland",
  APE: "apecoin",
  RENDER: "render-token",
  FET: "fetch-ai",
  OCEAN: "ocean-protocol",
  AGIX: "singularitynet",
  DAI: "dai",
  FRAX: "frax",
  WSTETH: "wrapped-steth",
  STETH: "staked-ether",
  CBETH: "coinbase-wrapped-staked-eth",
  RETH: "rocket-pool-eth",
  ENS: "ethereum-name-service",
  OP: "optimism",
  ARB: "arbitrum",
  IMX: "immutable-x",
  AXS: "axie-infinity",
  GALA: "gala",
  ILV: "illuvium",
  YFI: "yearn-finance",
  INCH: "1inch",
  PENDLE: "pendle",
  JOE: "joe",
  GMX: "gmx",
  MAGIC: "magic",
  RDNT: "radiant-capital",
  CAKE: "pancakeswap-token",
  DOGE: "dogecoin",
  SHIB: "shiba-inu",
  PEPE: "pepe",
  FLOKI: "floki",
  WLD: "worldcoin-wld",
  ONDO: "ondo-finance",
  ENA: "ethena",
  W: "wormhole",
  STRK: "starknet",
  TIA: "celestia",
  SEI: "sei-network",
  SUI: "sui",
  APT: "aptos",
  INJ: "injective-protocol",
  ATOM: "cosmos",
  DOT: "polkadot",
  AVAX: "avalanche-2",
  SOL: "solana",
  NEAR: "near",
  FTM: "fantom",
  ALGO: "algorand",
  XLM: "stellar",
  XRP: "ripple",
  ADA: "cardano",
  RNDR: "render-token",
  TAO: "bittensor",
  FIL: "filecoin",
  THETA: "theta-token",
  AR: "arweave",
  JASMY: "jasmycoin",
  CHZ: "chiliz",
  ENJ: "enjincoin",
  SUPER: "superfarm",
  BLUR: "blur",
  LOOKS: "looksrare",
  X2Y2: "x2y2",
  MASK: "mask-network",
  BAND: "band-protocol",
  API3: "api3",
  STORJ: "storj",
  ANKR: "ankr",
  SKL: "skale",
  CELR: "celer-network",
  CTSI: "cartesi",
  BICO: "biconomy",
  DODO: "dodo",
  PERP: "perpetual-protocol",
  RBN: "ribbon-finance",
  TRIBE: "tribe-2",
  ALCX: "alchemix",
  SPELL: "spell-token",
  ICE: "ice-network",
  MATIC: "matic-network",
  KNC: "kyber-network-crystal",
  ZRX: "0x",
  REN: "republic-protocol",
  OMG: "omisego",
  POLY: "polymath",
  TEL: "telcoin",
  QUICK: "quickswap",
};

export interface LiveCoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  market_cap_rank: number;
  high_24h?: number;
  low_24h?: number;
  ath?: number;
  ath_date?: string;
  atl?: number;
  atl_date?: string;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number | null;
  fully_diluted_valuation?: number;
  sparkline_in_7d?: { price: number[] };
}

interface UsePolygonMarketDataReturn {
  coins: LiveCoinData[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isLive: boolean;
  refetch: () => void;
}

const POLL_INTERVAL = 30_000;
const API_BASE = "https://api.coingecko.com/api/v3";

export function usePolygonMarketData(): UsePolygonMarketDataReturn {
  const [coins, setCoins] = useState<LiveCoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const allIds = Object.values(COINGECKO_IDS);
      const uniqueIds = [...new Set(allIds)];
      
      // CoinGecko free tier allows 250 ids per request, split into pages of 100
      const pages = [];
      for (let i = 0; i < uniqueIds.length; i += 100) {
        pages.push(uniqueIds.slice(i, i + 100).join(","));
      }

      const results: LiveCoinData[] = [];
      for (const ids of pages) {
        const url = `${API_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=250&page=1&sparkline=true&price_change_percentage=24h`;
        const res = await fetch(url);
        if (!res.ok) {
          if (res.status === 429) {
            setIsLive(false);
            return;
          }
          throw new Error(`CoinGecko API ${res.status}`);
        }
        const data: LiveCoinData[] = await res.json();
        results.push(...data);
      }

      setCoins(results);
      setLastUpdated(new Date());
      setIsLive(true);
      setError(null);
    } catch (err: any) {
      console.warn("CoinGecko fetch failed, using cached data:", err.message);
      setError(err.message);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { coins, loading, error, lastUpdated, isLive, refetch: fetchData };
}

export function getCoinGeckoSymbol(cgId: string): string | undefined {
  return Object.entries(COINGECKO_IDS).find(([, v]) => v === cgId)?.[0];
}
