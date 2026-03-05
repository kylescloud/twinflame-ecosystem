import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, AlertTriangle, Gift } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import type { UserPooledPosition, P2PLoan } from '../types';
import { formatCurrency, formatNumber, getHealthFactorColor, cn } from '../lib/utils';

interface PortfolioProps {
  onNavigate: (path: string) => void;
}

export function Portfolio({ onNavigate }: PortfolioProps) {
  const [netWorth, setNetWorth] = useState(0);
  const [healthFactor, setHealthFactor] = useState(2.5);
  const [pooledPositions, setPooledPositions] = useState<UserPooledPosition[]>([]);
  const [activeLoans, setActiveLoans] = useState<P2PLoan[]>([]);
  const [claimableRewards, setClaimableRewards] = useState(0);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  async function loadPortfolioData() {
    const mockAddress = '0x1234567890123456789012345678901234567890';

    const { data: positionsData } = await supabase
      .from('user_pooled_positions')
      .select(`
        *,
        market:market_id(
          *,
          token:token_id(*)
        )
      `)
      .eq('user_address', mockAddress);

    if (positionsData) {
      setPooledPositions(positionsData as any);
    }

    const { data: loansData } = await supabase
      .from('p2p_loans')
      .select(`
        *,
        offer:offer_id(
          *,
          lend_token:lend_token_id(*),
          collateral_token:collateral_token_id(*)
        )
      `)
      .or(`lender_address.eq.${mockAddress},borrower_address.eq.${mockAddress}`)
      .eq('status', 'active');

    if (loansData) {
      setActiveLoans(loansData as any);
    }

    const { data: rewardsData } = await supabase
      .from('user_rewards')
      .select('amount')
      .eq('user_address', mockAddress)
      .eq('claimed', false);

    if (rewardsData) {
      const total = rewardsData.reduce((sum, r) => sum + Number(r.amount), 0);
      setClaimableRewards(total);
    }

    let totalSupplied = 0;
    let totalBorrowed = 0;

    if (positionsData) {
      positionsData.forEach((pos: any) => {
        totalSupplied += Number(pos.supplied_amount) * (pos.market?.token?.price_usd || 0);
        totalBorrowed += Number(pos.borrowed_amount) * (pos.market?.token?.price_usd || 0);
      });
    }

    setNetWorth(totalSupplied - totalBorrowed);
    if (totalBorrowed > 0) {
      setHealthFactor((totalSupplied * 0.8) / totalBorrowed);
    }
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Portfolio</h1>
          <p className="text-gray-400">Track your positions, health factor, and earnings</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Net Worth</span>
              </div>
              <div className="text-2xl font-bold text-white">{formatCurrency(netWorth)}</div>
              <div className="text-xs text-green-500 mt-1">+5.2% this month</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Total Supplied</span>
              </div>
              <div className="text-2xl font-bold text-white">{formatCurrency(netWorth)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Health Factor</span>
              </div>
              <div className={cn('text-2xl font-bold', getHealthFactorColor(healthFactor))}>
                {healthFactor === Infinity ? '∞' : healthFactor.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {healthFactor >= 2 ? 'Safe' : healthFactor >= 1.5 ? 'Good' : 'At Risk'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <Gift className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Claimable Rewards</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(claimableRewards)}
              </div>
              <Button size="sm" className="w-full mt-2">
                Claim All
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pooled Positions</CardTitle>
            </CardHeader>
            <CardContent>
              {pooledPositions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No pooled positions yet</p>
                  <Button onClick={() => onNavigate('/lend')}>Start Lending</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pooledPositions.map((position) => (
                    <div
                      key={position.id}
                      className="p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-600 rounded-full"></div>
                          <span className="font-semibold text-white">USDC</span>
                        </div>
                        <span className="text-sm text-gray-400">
                          Health: {position.health_factor.toFixed(2)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Supplied</span>
                          <div className="text-white font-medium">
                            {formatNumber(position.supplied_amount)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Borrowed</span>
                          <div className="text-white font-medium">
                            {formatNumber(position.borrowed_amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active P2P Loans</CardTitle>
            </CardHeader>
            <CardContent>
              {activeLoans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No active P2P loans</p>
                  <Button onClick={() => onNavigate('/lend?tab=p2p')}>Browse Offers</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className="p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-white">
                          {formatNumber(loan.lend_amount)} USDC
                        </span>
                        <span className="text-sm text-green-500">{loan.interest_rate}%</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Repaid</span>
                          <div className="text-white font-medium">
                            {formatNumber(loan.repaid_amount)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Due Date</span>
                          <div className="text-white font-medium">
                            {new Date(loan.due_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
