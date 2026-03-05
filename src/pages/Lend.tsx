import { useState, useEffect } from 'react';
import { Plus, Shield } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import type { PooledMarket, P2POffer, Token } from '../types';
import { formatNumber, cn } from '../lib/utils';
import { COMMON_TOKENS, createP2POffer } from '../lib/contracts';

type LendTab = 'pooled' | 'p2p';

interface LendProps {
  onNavigate: (_path: string) => void;
}

export function Lend({ onNavigate: _onNavigate }: LendProps) {
  const [activeTab, setActiveTab] = useState<LendTab>('pooled');
  const [pooledMarkets, setPooledMarkets] = useState<PooledMarket[]>([]);
  const [p2pOffers, setP2pOffers] = useState<P2POffer[]>([]);
  const [showCreateOfferModal, setShowCreateOfferModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<PooledMarket | null>(null);
  const [creating, setCreating] = useState(false);

  const [offerForm, setOfferForm] = useState({
    lendToken: COMMON_TOKENS[1],
    collateralToken: COMMON_TOKENS[0],
    amount: '',
    interestRate: '',
    durationDays: '30',
    collateralRatio: '150',
  });

  const [supplyForm, setSupplyForm] = useState({
    amount: '',
    action: 'supply' as 'supply' | 'borrow',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    const { data: marketsData } = await supabase
      .from('pooled_markets')
      .select(`
        *,
        token:token_id(*)
      `)
      .order('total_supplied', { ascending: false });

    if (marketsData) {
      setPooledMarkets(
        marketsData.map((market) => ({
          id: market.id,
          token: market.token as Token,
          total_supplied: Number(market.total_supplied),
          total_borrowed: Number(market.total_borrowed),
          supply_apy: Number(market.supply_apy),
          borrow_apy: Number(market.borrow_apy),
          utilization_rate: Number(market.utilization_rate),
          reserve_factor: Number(market.reserve_factor),
          collateral_factor: Number(market.collateral_factor),
          liquidation_threshold: Number(market.liquidation_threshold),
        }))
      );
    }

    const { data: offersData } = await supabase
      .from('p2p_offers')
      .select(`
        *,
        lend_token:lend_token_id(*),
        collateral_token:collateral_token_id(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (offersData) {
      setP2pOffers(
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

  async function handleCreateOffer() {
    setCreating(true);
    try {
      const result = await createP2POffer(
        offerForm.lendToken.address,
        offerForm.collateralToken.address,
        offerForm.amount,
        parseFloat(offerForm.interestRate),
        parseInt(offerForm.durationDays),
        parseFloat(offerForm.collateralRatio),
        '0x0000000000000000000000000000000000000000'
      );

      if (result.success) {
        alert('P2P offer created successfully!');
        setShowCreateOfferModal(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      alert('Failed to create offer');
    }
    setCreating(false);
  }

  function openSupplyModal(market: PooledMarket, action: 'supply' | 'borrow') {
    setSelectedMarket(market);
    setSupplyForm({ amount: '', action });
    setShowSupplyModal(true);
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Lend & Borrow</h1>
          <p className="text-gray-400">
            Choose between instant pooled liquidity or custom P2P fixed-rate loans
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pooled')}
              className={cn(
                'px-6 py-2.5 rounded-lg font-medium transition-all duration-200',
                activeTab === 'pooled'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              )}
            >
              Pooled Markets
            </button>
            <button
              onClick={() => setActiveTab('p2p')}
              className={cn(
                'px-6 py-2.5 rounded-lg font-medium transition-all duration-200',
                activeTab === 'p2p'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              )}
            >
              P2P Offers
            </button>
          </div>

          {activeTab === 'p2p' && (
            <Button onClick={() => setShowCreateOfferModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Offer
            </Button>
          )}
        </div>

        {activeTab === 'pooled' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pooledMarkets.map((market) => (
              <Card key={market.id} className="hover:border-primary-600/50 transition-colors">
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    {market.token.logo_url && (
                      <img
                        src={market.token.logo_url}
                        alt={market.token.symbol}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div>
                      <div className="text-xl font-bold text-white">{market.token.symbol}</div>
                      <div className="text-sm text-gray-400">{market.token.name}</div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Supply APY</span>
                      <span className="text-green-500 font-bold text-lg">
                        {market.supply_apy.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Borrow APY</span>
                      <span className="text-red-500 font-semibold">
                        {market.borrow_apy.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Total Supplied</span>
                      <span className="text-white font-medium">
                        {formatNumber(market.total_supplied)} {market.token.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Utilization</span>
                      <span className="text-white font-medium">
                        {(market.utilization_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => openSupplyModal(market, 'supply')}
                    >
                      Supply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openSupplyModal(market, 'borrow')}
                    >
                      Borrow
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {p2pOffers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-400 mb-4">No P2P offers available yet</p>
                  <Button onClick={() => setShowCreateOfferModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Offer
                  </Button>
                </CardContent>
              </Card>
            ) : (
              p2pOffers.map((offer) => (
                <Card key={offer.id} className="hover:border-primary-600/50 transition-colors">
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-3">
                          {offer.lend_token.logo_url && (
                            <img
                              src={offer.lend_token.logo_url}
                              alt={offer.lend_token.symbol}
                              className="w-12 h-12 rounded-full"
                            />
                          )}
                          <div>
                            <div className="font-bold text-white text-lg">
                              {formatNumber(offer.lend_amount)} {offer.lend_token.symbol}
                            </div>
                            <div className="text-sm text-gray-400">Lend Amount</div>
                          </div>
                        </div>

                        <div className="hidden md:block w-px h-12 bg-gray-800"></div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                          <div>
                            <div className="text-green-500 font-bold text-lg">
                              {offer.interest_rate}%
                            </div>
                            <div className="text-xs text-gray-400">Interest Rate</div>
                          </div>
                          <div>
                            <div className="text-white font-semibold">
                              {offer.duration_days} days
                            </div>
                            <div className="text-xs text-gray-400">Duration</div>
                          </div>
                          <div>
                            <div className="text-white font-semibold">
                              {offer.collateral_ratio}%
                            </div>
                            <div className="text-xs text-gray-400">Collateral</div>
                          </div>
                          <div>
                            <div className="text-white font-semibold">
                              {offer.collateral_token.symbol}
                            </div>
                            <div className="text-xs text-gray-400">Required</div>
                          </div>
                        </div>
                      </div>

                      <Button>Accept Offer</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateOfferModal}
        onClose={() => setShowCreateOfferModal(false)}
        title="Create P2P Lending Offer"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Token to Lend
            </label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white"
              value={offerForm.lendToken.symbol}
              onChange={(e) => {
                const token = COMMON_TOKENS.find((t) => t.symbol === e.target.value);
                if (token) setOfferForm({ ...offerForm, lendToken: token });
              }}
            >
              {COMMON_TOKENS.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Amount</label>
            <Input
              type="number"
              placeholder="0.0"
              value={offerForm.amount}
              onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Interest Rate (%)
              </label>
              <Input
                type="number"
                placeholder="10.5"
                value={offerForm.interestRate}
                onChange={(e) => setOfferForm({ ...offerForm, interestRate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Duration (days)
              </label>
              <Input
                type="number"
                placeholder="30"
                value={offerForm.durationDays}
                onChange={(e) => setOfferForm({ ...offerForm, durationDays: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Collateral Token
            </label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white"
              value={offerForm.collateralToken.symbol}
              onChange={(e) => {
                const token = COMMON_TOKENS.find((t) => t.symbol === e.target.value);
                if (token) setOfferForm({ ...offerForm, collateralToken: token });
              }}
            >
              {COMMON_TOKENS.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Collateral Ratio (%)
            </label>
            <Input
              type="number"
              placeholder="150"
              value={offerForm.collateralRatio}
              onChange={(e) => setOfferForm({ ...offerForm, collateralRatio: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Borrower must provide collateral worth this percentage of the loan value
            </p>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <Button
              className="w-full"
              size="lg"
              onClick={handleCreateOffer}
              disabled={creating}
            >
              {creating ? 'Creating Offer...' : 'Create P2P Offer'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSupplyModal}
        onClose={() => setShowSupplyModal(false)}
        title={supplyForm.action === 'supply' ? 'Supply' : 'Borrow'}
        size="md"
      >
        {selectedMarket && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
              {selectedMarket.token.logo_url && (
                <img
                  src={selectedMarket.token.logo_url}
                  alt={selectedMarket.token.symbol}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <div className="font-bold text-white">{selectedMarket.token.symbol}</div>
                <div className="text-sm text-gray-400">
                  {supplyForm.action === 'supply' ? 'Supply APY' : 'Borrow APY'}:{' '}
                  <span className={supplyForm.action === 'supply' ? 'text-green-500' : 'text-red-500'}>
                    {(supplyForm.action === 'supply'
                      ? selectedMarket.supply_apy
                      : selectedMarket.borrow_apy
                    ).toFixed(2)}
                    %
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Amount</label>
              <Input
                type="number"
                placeholder="0.0"
                value={supplyForm.amount}
                onChange={(e) => setSupplyForm({ ...supplyForm, amount: e.target.value })}
              />
            </div>

            <Button className="w-full" size="lg">
              {supplyForm.action === 'supply' ? 'Supply' : 'Borrow'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
