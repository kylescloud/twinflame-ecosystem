import { useEffect, useState } from 'react';
import { ArrowRight, TrendingUp, Zap, Shield, Percent } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatNumber } from '../lib/utils';
import type { ProtocolStats, P2POffer, Token } from '../types';

interface DiscoverProps {
  onNavigate: (path: string) => void;
}

export function Discover({ onNavigate }: DiscoverProps) {
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [hotOffers, setHotOffers] = useState<P2POffer[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: statsData } = await supabase
      .from('protocol_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (statsData) {
      setStats({
        total_tvl: Number(statsData.total_tvl),
        pooled_tvl: Number(statsData.pooled_tvl),
        p2p_tvl: Number(statsData.p2p_tvl),
        swap_volume_24h: Number(statsData.swap_volume_24h),
        total_fees_earned: Number(statsData.total_fees_earned),
        unique_users: Number(statsData.unique_users),
      });
    }

    const { data: offersData } = await supabase
      .from('p2p_offers')
      .select(`
        *,
        lend_token:lend_token_id(id, symbol, name, logo_url, price_usd),
        collateral_token:collateral_token_id(id, symbol, name, logo_url, price_usd)
      `)
      .eq('status', 'active')
      .order('interest_rate', { ascending: false })
      .limit(3);

    if (offersData) {
      setHotOffers(
        offersData.map((offer) => ({
          id: offer.id,
          lender_address: offer.lender_address,
          lend_token: offer.lend_token as Token,
          collateral_token: offer.collateral_token as Token,
          lend_amount: Number(offer.lend_amount),
          interest_rate: Number(offer.interest_rate),
          duration_days: offer.duration_days,
          collateral_ratio: Number(offer.collateral_ratio),
          status: offer.status,
          created_at: offer.created_at,
          expires_at: offer.expires_at,
        }))
      );
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-900/20 via-gray-900 to-gray-900 border-b border-gray-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Deep Liquidity Meets
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                Instant Yield
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-8">
              Swap at best prices across Polygon DEXs and automatically earn yield.
              Choose between instant pooled lending or custom P2P fixed-rate loans.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => onNavigate('/trade')}>
                <Zap className="w-5 h-5 mr-2" />
                Start Swap & Earn
              </Button>
              <Button size="lg" variant="outline" onClick={() => onNavigate('/lend')}>
                <Percent className="w-5 h-5 mr-2" />
                Explore Lending
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card>
            <CardContent>
              <div className="text-gray-400 text-sm mb-1">Total TVL</div>
              <div className="text-2xl font-bold text-white">
                {stats ? formatCurrency(stats.total_tvl, 0) : '$0'}
              </div>
              <div className="text-green-500 text-xs mt-1">+12.5% this week</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-gray-400 text-sm mb-1">24h Volume</div>
              <div className="text-2xl font-bold text-white">
                {stats ? formatCurrency(stats.swap_volume_24h, 0) : '$0'}
              </div>
              <div className="text-green-500 text-xs mt-1">+8.2% today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-gray-400 text-sm mb-1">Total Fees</div>
              <div className="text-2xl font-bold text-white">
                {stats ? formatCurrency(stats.total_fees_earned, 0) : '$0'}
              </div>
              <div className="text-gray-400 text-xs mt-1">Earned by protocol</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-gray-400 text-sm mb-1">Active Users</div>
              <div className="text-2xl font-bold text-white">
                {stats ? formatNumber(stats.unique_users, 0) : '0'}
              </div>
              <div className="text-green-500 text-xs mt-1">+15.3% growth</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent>
              <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Instant Yield Swaps</h3>
              <p className="text-gray-400 mb-4">
                Swap any token and automatically supply to lending pools in one transaction. Start earning immediately.
              </p>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('/trade')}>
                Try Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Hybrid Lending</h3>
              <p className="text-gray-400 mb-4">
                Choose between instant pooled liquidity or higher fixed-rate P2P loans with custom terms.
              </p>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('/lend')}>
                Explore <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Best Price Routing</h3>
              <p className="text-gray-400 mb-4">
                Aggregated quotes from QuickSwap, SushiSwap, and 1inch. Always get the best price on Polygon.
              </p>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('/market')}>
                View Markets <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {hotOffers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Hot P2P Offers</h2>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('/lend?tab=p2p')}>
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {hotOffers.map((offer) => (
                <Card key={offer.id} className="hover:border-primary-600/50 transition-colors cursor-pointer">
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {offer.lend_token.logo_url && (
                          <img src={offer.lend_token.logo_url} alt={offer.lend_token.symbol} className="w-8 h-8 rounded-full" />
                        )}
                        <div>
                          <div className="font-semibold text-white">{offer.lend_token.symbol}</div>
                          <div className="text-xs text-gray-500">{offer.duration_days} days</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-500">{offer.interest_rate}%</div>
                        <div className="text-xs text-gray-500">APY</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount</span>
                        <span className="text-white font-medium">{formatNumber(offer.lend_amount)} {offer.lend_token.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Collateral</span>
                        <span className="text-white font-medium">{offer.collateral_token.symbol} ({offer.collateral_ratio}%)</span>
                      </div>
                    </div>
                    <Button size="sm" className="w-full mt-4">
                      Accept Offer
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
