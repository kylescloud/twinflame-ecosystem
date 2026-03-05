import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      tokens: {
        Row: {
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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tokens']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tokens']['Insert']>;
      };
      pooled_markets: {
        Row: {
          id: string;
          token_id: string;
          total_supplied: number;
          total_borrowed: number;
          supply_apy: number;
          borrow_apy: number;
          utilization_rate: number;
          reserve_factor: number;
          collateral_factor: number;
          liquidation_threshold: number;
          updated_at: string;
        };
      };
      user_pooled_positions: {
        Row: {
          id: string;
          user_address: string;
          market_id: string;
          supplied_amount: number;
          borrowed_amount: number;
          health_factor: number;
          created_at: string;
          updated_at: string;
        };
      };
      p2p_offers: {
        Row: {
          id: string;
          lender_address: string;
          lend_token_id: string;
          collateral_token_id: string;
          lend_amount: number;
          interest_rate: number;
          duration_days: number;
          collateral_ratio: number;
          status: 'active' | 'filled' | 'cancelled' | 'expired';
          created_at: string;
          expires_at: string | null;
        };
      };
      p2p_loans: {
        Row: {
          id: string;
          offer_id: string;
          lender_address: string;
          borrower_address: string;
          lend_amount: number;
          collateral_amount: number;
          interest_rate: number;
          start_date: string;
          due_date: string;
          status: 'active' | 'repaid' | 'liquidated' | 'defaulted';
          repaid_amount: number;
        };
      };
      swap_transactions: {
        Row: {
          id: string;
          user_address: string;
          from_token_id: string;
          to_token_id: string;
          from_amount: number;
          to_amount: number;
          protocol_fee: number;
          dex_source: string;
          instant_yield_enabled: boolean;
          tx_hash: string | null;
          created_at: string;
        };
      };
      protocol_stats: {
        Row: {
          id: string;
          date: string;
          total_tvl: number;
          pooled_tvl: number;
          p2p_tvl: number;
          swap_volume_24h: number;
          total_fees_earned: number;
          unique_users: number;
          updated_at: string;
        };
      };
      user_rewards: {
        Row: {
          id: string;
          user_address: string;
          reward_type: 'pooled_supply' | 'pooled_borrow' | 'p2p_lend' | 'p2p_borrow' | 'swap';
          amount: number;
          claimed: boolean;
          created_at: string;
          claimed_at: string | null;
        };
      };
    };
  };
};
