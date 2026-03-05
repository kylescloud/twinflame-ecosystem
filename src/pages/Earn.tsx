import { Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface EarnProps {
  onNavigate: (path: string) => void;
}

export function Earn({ onNavigate }: EarnProps) {
  const opportunities = [
    {
      id: '1',
      type: 'Pooled Supply',
      token: 'USDC',
      apy: 8.5,
      tvl: 2500000,
      rewards: 'MATIC + Protocol Tokens',
      icon: TrendingUp,
    },
    {
      id: '2',
      type: 'P2P Lending',
      token: 'WETH',
      apy: 12.3,
      tvl: 850000,
      rewards: 'Protocol Tokens',
      icon: Sparkles,
    },
    {
      id: '3',
      type: 'Instant Yield Swaps',
      token: 'Any Token',
      apy: 7.8,
      tvl: 1200000,
      rewards: 'Auto-compounding',
      icon: Zap,
    },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Earn Rewards</h1>
          <p className="text-gray-400">Maximize your yield with multiple earning strategies</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent>
              <div className="text-gray-400 text-sm mb-1">Total Rewards Earned</div>
              <div className="text-2xl font-bold text-white">$12,453</div>
              <div className="text-green-500 text-xs mt-1">+$234 this week</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-gray-400 text-sm mb-1">Active Positions</div>
              <div className="text-2xl font-bold text-white">8</div>
              <div className="text-gray-400 text-xs mt-1">Across 3 strategies</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="text-gray-400 text-sm mb-1">Average APY</div>
              <div className="text-2xl font-bold text-green-500">9.2%</div>
              <div className="text-gray-400 text-xs mt-1">Portfolio weighted</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {opportunities.map((opp) => (
            <Card key={opp.id} className="hover:border-primary-600/50 transition-colors">
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center">
                      <opp.icon className="w-6 h-6 text-primary-500" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-lg">{opp.type}</div>
                      <div className="text-sm text-gray-400">{opp.token}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 flex-1">
                    <div>
                      <div className="text-green-500 font-bold text-xl">{opp.apy}%</div>
                      <div className="text-xs text-gray-400">APY</div>
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        ${(opp.tvl / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-xs text-gray-400">TVL</div>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{opp.rewards}</div>
                      <div className="text-xs text-gray-400">Rewards</div>
                    </div>
                  </div>

                  <Button>Start Earning</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-gradient-to-br from-primary-900/20 to-gray-900 border-primary-600/30">
          <CardHeader>
            <CardTitle>Boost Your Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              Stack multiple strategies to maximize your yield. Use Instant Yield Swaps to
              automatically supply tokens after swapping, then earn additional rewards on top of
              your lending APY.
            </p>
            <Button onClick={() => onNavigate('/trade')}>
              <Zap className="w-4 h-4 mr-2" />
              Try Instant Yield Swaps
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
