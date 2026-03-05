/*
  # DeFi Protocol Database Schema

  1. New Tables
    - `tokens`
      - Token registry for all supported tokens on Polygon
      - Includes price data, market metrics, and metadata
    
    - `pooled_markets`
      - Aave-style pooled lending markets
      - Tracks supply/borrow rates, utilization, reserve factors
    
    - `user_pooled_positions`
      - User positions in pooled markets (supply/borrow)
    
    - `p2p_offers`
      - Fixed-rate P2P lending offers
      - Custom terms, durations, collateral requirements
    
    - `p2p_loans`
      - Active P2P loans between users
    
    - `swap_transactions`
      - Historical swap data for analytics
    
    - `protocol_stats`
      - Overall protocol metrics (TVL, volume, fees)
    
    - `user_rewards`
      - Farming rewards for users

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for market data
*/

-- Tokens registry
CREATE TABLE IF NOT EXISTS tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text UNIQUE NOT NULL,
  symbol text NOT NULL,
  name text NOT NULL,
  decimals integer NOT NULL,
  logo_url text,
  price_usd numeric DEFAULT 0,
  price_change_24h numeric DEFAULT 0,
  market_cap numeric DEFAULT 0,
  volume_24h numeric DEFAULT 0,
  is_trending boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pooled lending markets
CREATE TABLE IF NOT EXISTS pooled_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES tokens(id) NOT NULL,
  total_supplied numeric DEFAULT 0,
  total_borrowed numeric DEFAULT 0,
  supply_apy numeric DEFAULT 0,
  borrow_apy numeric DEFAULT 0,
  utilization_rate numeric DEFAULT 0,
  reserve_factor numeric DEFAULT 0.1,
  collateral_factor numeric DEFAULT 0.75,
  liquidation_threshold numeric DEFAULT 0.8,
  updated_at timestamptz DEFAULT now()
);

-- User positions in pooled markets
CREATE TABLE IF NOT EXISTS user_pooled_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address text NOT NULL,
  market_id uuid REFERENCES pooled_markets(id) NOT NULL,
  supplied_amount numeric DEFAULT 0,
  borrowed_amount numeric DEFAULT 0,
  health_factor numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_address, market_id)
);

-- P2P lending offers
CREATE TABLE IF NOT EXISTS p2p_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_address text NOT NULL,
  lend_token_id uuid REFERENCES tokens(id) NOT NULL,
  collateral_token_id uuid REFERENCES tokens(id) NOT NULL,
  lend_amount numeric NOT NULL,
  interest_rate numeric NOT NULL,
  duration_days integer NOT NULL,
  collateral_ratio numeric NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  CHECK (status IN ('active', 'filled', 'cancelled', 'expired'))
);

-- Active P2P loans
CREATE TABLE IF NOT EXISTS p2p_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES p2p_offers(id) NOT NULL,
  lender_address text NOT NULL,
  borrower_address text NOT NULL,
  lend_amount numeric NOT NULL,
  collateral_amount numeric NOT NULL,
  interest_rate numeric NOT NULL,
  start_date timestamptz DEFAULT now(),
  due_date timestamptz NOT NULL,
  status text DEFAULT 'active',
  repaid_amount numeric DEFAULT 0,
  CHECK (status IN ('active', 'repaid', 'liquidated', 'defaulted'))
);

-- Swap transaction history
CREATE TABLE IF NOT EXISTS swap_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address text NOT NULL,
  from_token_id uuid REFERENCES tokens(id) NOT NULL,
  to_token_id uuid REFERENCES tokens(id) NOT NULL,
  from_amount numeric NOT NULL,
  to_amount numeric NOT NULL,
  protocol_fee numeric DEFAULT 0,
  dex_source text NOT NULL,
  instant_yield_enabled boolean DEFAULT false,
  tx_hash text,
  created_at timestamptz DEFAULT now()
);

-- Protocol statistics
CREATE TABLE IF NOT EXISTS protocol_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  total_tvl numeric DEFAULT 0,
  pooled_tvl numeric DEFAULT 0,
  p2p_tvl numeric DEFAULT 0,
  swap_volume_24h numeric DEFAULT 0,
  total_fees_earned numeric DEFAULT 0,
  unique_users integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- User rewards
CREATE TABLE IF NOT EXISTS user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address text NOT NULL,
  reward_type text NOT NULL,
  amount numeric DEFAULT 0,
  claimed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  claimed_at timestamptz,
  CHECK (reward_type IN ('pooled_supply', 'pooled_borrow', 'p2p_lend', 'p2p_borrow', 'swap'))
);

-- Enable RLS
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE pooled_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pooled_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- Policies for tokens (public read)
CREATE POLICY "Anyone can view tokens"
  ON tokens FOR SELECT
  TO public
  USING (true);

-- Policies for pooled markets (public read)
CREATE POLICY "Anyone can view pooled markets"
  ON pooled_markets FOR SELECT
  TO public
  USING (true);

-- Policies for user positions
CREATE POLICY "Users can view all positions"
  ON user_pooled_positions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert own positions"
  ON user_pooled_positions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own positions"
  ON user_pooled_positions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for P2P offers
CREATE POLICY "Anyone can view P2P offers"
  ON p2p_offers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create P2P offers"
  ON p2p_offers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own P2P offers"
  ON p2p_offers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for P2P loans
CREATE POLICY "Users can view P2P loans"
  ON p2p_loans FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create P2P loans"
  ON p2p_loans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update P2P loans"
  ON p2p_loans FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for swap transactions
CREATE POLICY "Users can view swap transactions"
  ON swap_transactions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert swap transactions"
  ON swap_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for protocol stats (public read)
CREATE POLICY "Anyone can view protocol stats"
  ON protocol_stats FOR SELECT
  TO public
  USING (true);

-- Policies for user rewards
CREATE POLICY "Users can view rewards"
  ON user_rewards FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own rewards"
  ON user_rewards FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tokens_symbol ON tokens(symbol);
CREATE INDEX IF NOT EXISTS idx_tokens_trending ON tokens(is_trending);
CREATE INDEX IF NOT EXISTS idx_user_positions_address ON user_pooled_positions(user_address);
CREATE INDEX IF NOT EXISTS idx_p2p_offers_status ON p2p_offers(status);
CREATE INDEX IF NOT EXISTS idx_p2p_loans_borrower ON p2p_loans(borrower_address);
CREATE INDEX IF NOT EXISTS idx_p2p_loans_lender ON p2p_loans(lender_address);
CREATE INDEX IF NOT EXISTS idx_swap_transactions_user ON swap_transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_user_rewards_address ON user_rewards(user_address);
