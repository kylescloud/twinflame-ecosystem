export interface Token {
  id: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo_url: string | null;
  price_usd: number;
  price_change_24h: number;
  market_cap: number;
  volume_24h: number;
  is_trending: boolean;
}

export interface PooledMarket {
  id: string;
  token: Token;
  total_supplied: number;
  total_borrowed: number;
  supply_apy: number;
  borrow_apy: number;
  utilization_rate: number;
  reserve_factor: number;
  collateral_factor: number;
  liquidation_threshold: number;
}

export interface UserPooledPosition {
  id: string;
  user_address: string;
  market: PooledMarket;
  supplied_amount: number;
  borrowed_amount: number;
  health_factor: number;
}

export interface P2POffer {
  id: string;
  lender_address: string;
  lend_token: Token;
  collateral_token: Token;
  lend_amount: number;
  interest_rate: number;
  duration_days: number;
  collateral_ratio: number;
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  created_at: string;
  expires_at: string | null;
}

export interface P2PLoan {
  id: string;
  offer: P2POffer;
  lender_address: string;
  borrower_address: string;
  lend_amount: number;
  collateral_amount: number;
  interest_rate: number;
  start_date: string;
  due_date: string;
  status: 'active' | 'repaid' | 'liquidated' | 'defaulted';
  repaid_amount: number;
}

export interface SwapRoute {
  dex: string;
  path: string[];
  expectedOutput: string;
  priceImpact: number;
  protocolFee: number;
}

export interface ProtocolStats {
  total_tvl: number;
  pooled_tvl: number;
  p2p_tvl: number;
  swap_volume_24h: number;
  total_fees_earned: number;
  unique_users: number;
}
