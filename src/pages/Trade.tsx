import { useState, useEffect } from 'react';
import { ArrowDownUp, Settings, Info, Zap, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { getAggregatedQuote, COMMON_TOKENS, executeSwap, type SwapQuote } from '../lib/contracts';
import { formatCurrency, estimateEarnings, cn } from '../lib/utils';

interface TradeProps {
  onNavigate: (_path: string) => void;
}

export function Trade({ onNavigate: _onNavigate }: TradeProps) {
  const [fromToken, setFromToken] = useState(COMMON_TOKENS[0]);
  const [toToken, setToToken] = useState(COMMON_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [instantYieldEnabled, setInstantYieldEnabled] = useState(true);
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);

  const mockSupplyAPY = 8.5;

  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      fetchQuote();
    } else {
      setQuote(null);
    }
  }, [fromAmount, fromToken, toToken]);

  async function fetchQuote() {
    setLoading(true);
    try {
      const quoteData = await getAggregatedQuote(
        fromToken.address,
        toToken.address,
        fromAmount
      );
      setQuote(quoteData);
    } catch (error) {
      console.error('Error fetching quote:', error);
    }
    setLoading(false);
  }

  async function handleSwap() {
    if (!quote) return;

    setSwapping(true);
    try {
      const result = await executeSwap(
        quote,
        '0x0000000000000000000000000000000000000000',
        instantYieldEnabled
      );

      if (result.success) {
        alert('Swap successful! You are now earning yield automatically.');
        setFromAmount('');
        setQuote(null);
      }
    } catch (error) {
      console.error('Error executing swap:', error);
      alert('Swap failed. Please try again.');
    }
    setSwapping(false);
  }

  function switchTokens() {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  }

  const estimatedYield7d = quote && instantYieldEnabled
    ? estimateEarnings(parseFloat(quote.toAmount), mockSupplyAPY, 7)
    : 0;

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Trade & Earn</h1>
            <p className="text-gray-400">
              Swap at best prices and automatically earn yield on your tokens
            </p>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Swap</CardTitle>
                <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                  <Settings className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-800 rounded-xl p-4 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">From</span>
                  <span className="text-sm text-gray-400">Balance: 0.00</span>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="flex-1 bg-transparent border-none text-2xl font-semibold focus:ring-0"
                  />
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                    {fromToken.logo_url && (
                      <img src={fromToken.logo_url} alt={fromToken.symbol} className="w-6 h-6" />
                    )}
                    <span className="font-semibold text-white">{fromToken.symbol}</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <button
                  onClick={switchTokens}
                  className="p-2 bg-gray-800 hover:bg-gray-700 border-4 border-gray-900 rounded-xl transition-all"
                >
                  <ArrowDownUp className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="bg-gray-800 rounded-xl p-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">To</span>
                  <span className="text-sm text-gray-400">Balance: 0.00</span>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={quote?.toAmount || ''}
                    readOnly
                    className="flex-1 bg-transparent border-none text-2xl font-semibold focus:ring-0"
                  />
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                    {toToken.logo_url && (
                      <img src={toToken.logo_url} alt={toToken.symbol} className="w-6 h-6" />
                    )}
                    <span className="font-semibold text-white">{toToken.symbol}</span>
                  </button>
                </div>
              </div>

              {quote && (
                <div className="mt-4 space-y-2 p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Route</span>
                    <span className="text-white font-medium">{quote.dex}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price Impact</span>
                    <span className={cn(
                      quote.priceImpact > 1 ? 'text-red-500' : 'text-green-500'
                    )}>
                      {quote.priceImpact.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Protocol Fee</span>
                    <span className="text-white">{(quote.protocolFee * 100).toFixed(2)}%</span>
                  </div>
                </div>
              )}

              <div className="mt-4 p-4 bg-primary-900/20 border border-primary-600/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={cn(
                      'w-10 h-5 rounded-full transition-colors relative cursor-pointer',
                      instantYieldEnabled ? 'bg-primary-600' : 'bg-gray-700'
                    )}
                      onClick={() => setInstantYieldEnabled(!instantYieldEnabled)}
                    >
                      <div className={cn(
                        'w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform',
                        instantYieldEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      )} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-primary-500" />
                      <span className="font-semibold text-white">Instant Yield Swaps</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Automatically supply {toToken.symbol} to lending pool after swap
                    </p>
                    {instantYieldEnabled && quote && (
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Supply APY</span>
                          <span className="text-green-500 font-semibold">{mockSupplyAPY}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Est. 7-day earnings</span>
                          <span className="text-white font-semibold">
                            {formatCurrency(estimatedYield7d)} {toToken.symbol}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                className="w-full mt-6"
                size="lg"
                disabled={!quote || swapping || loading}
                onClick={handleSwap}
              >
                {swapping ? 'Swapping...' : loading ? 'Getting Quote...' : 'Swap & Earn'}
              </Button>

              <div className="mt-4 flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-400">
                  One transaction to swap and start earning. Your funds remain liquid and can be withdrawn anytime from the Portfolio page.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="hover:border-primary-600/50 transition-colors">
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Best Rates</div>
                    <div className="text-sm text-gray-400">Aggregated from 3+ DEXs</div>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  We scan QuickSwap, SushiSwap, and 1inch to get you the best price on every trade.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:border-primary-600/50 transition-colors">
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Auto-Supply</div>
                    <div className="text-sm text-gray-400">One-click yield farming</div>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Enable Instant Yield Swaps to automatically supply your swapped tokens to our lending pools.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
