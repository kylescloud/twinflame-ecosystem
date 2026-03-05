import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, Plus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import type { Token } from '../types';
import { formatCurrency, formatPercent, cn } from '../lib/utils';

type MarketTab = 'top' | 'new' | 'gainers' | 'losers' | 'trending';

interface MarketProps {
  onNavigate: (path: string) => void;
}

export function Market({ onNavigate }: MarketProps) {
  const [activeTab, setActiveTab] = useState<MarketTab>('top');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTokens();
  }, [activeTab]);

  async function loadTokens() {
    setLoading(true);
    let query = supabase.from('tokens').select('*');

    switch (activeTab) {
      case 'top':
        query = query.order('market_cap', { ascending: false });
        break;
      case 'new':
        query = query.order('created_at', { ascending: false });
        break;
      case 'gainers':
        query = query.order('price_change_24h', { ascending: false });
        break;
      case 'losers':
        query = query.order('price_change_24h', { ascending: true });
        break;
      case 'trending':
        query = query.eq('is_trending', true).order('volume_24h', { ascending: false });
        break;
    }

    const { data } = await query.limit(20);

    if (data) {
      setTokens(
        data.map((token) => ({
          id: token.id,
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          logo_url: token.logo_url,
          price_usd: Number(token.price_usd),
          price_change_24h: Number(token.price_change_24h),
          market_cap: Number(token.market_cap),
          volume_24h: Number(token.volume_24h),
          is_trending: token.is_trending,
        }))
      );
    }

    setLoading(false);
  }

  const tabs: { id: MarketTab; label: string }[] = [
    { id: 'top', label: 'Top Coins' },
    { id: 'new', label: 'New Coins' },
    { id: 'gainers', label: 'Gainers' },
    { id: 'losers', label: 'Losers' },
    { id: 'trending', label: 'Trending' },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Polygon Market</h1>
          <p className="text-gray-400">
            Discover tokens, track prices, and trade directly with Instant Yield Swaps
          </p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">#</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Token</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">Price</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">24h %</th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium hidden md:table-cell">
                    Market Cap
                  </th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium hidden lg:table-cell">
                    Volume 24h
                  </th>
                  <th className="text-right py-4 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : tokens.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      No tokens found
                    </td>
                  </tr>
                ) : (
                  tokens.map((token, index) => (
                    <tr
                      key={token.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-gray-400">{index + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {token.logo_url ? (
                            <img
                              src={token.logo_url}
                              alt={token.symbol}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold">{token.symbol[0]}</span>
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white">{token.symbol}</div>
                            <div className="text-sm text-gray-500">{token.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-white">
                        {formatCurrency(token.price_usd)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1',
                            token.price_change_24h >= 0 ? 'text-green-500' : 'text-red-500'
                          )}
                        >
                          {token.price_change_24h >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {formatPercent(token.price_change_24h)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-400 hidden md:table-cell">
                        {formatCurrency(token.market_cap, 0)}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-400 hidden lg:table-cell">
                        {formatCurrency(token.volume_24h, 0)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => onNavigate(`/trade?token=${token.address}`)}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Swap & Earn
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onNavigate(`/lend?token=${token.address}&tab=p2p`)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            P2P
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
