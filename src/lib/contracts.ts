export const POLYGON_CHAIN_ID = 137;
export const POLYGON_RPC = 'https://polygon-rpc.com';

export const DEX_ROUTERS = {
  QUICKSWAP: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
  SUSHISWAP: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
  ONEINCH: '0x1111111254EEB25477B68fb85Ed929f73A960582',
};

export const PROTOCOL_CONTRACTS = {
  AGGREGATOR_ROUTER: '0x0000000000000000000000000000000000000001',
  POOLED_LENDING: '0x0000000000000000000000000000000000000002',
  P2P_LENDING: '0x0000000000000000000000000000000000000003',
  LIQUIDATION_ENGINE: '0x0000000000000000000000000000000000000004',
  REWARDS_DISTRIBUTOR: '0x0000000000000000000000000000000000000005',
};

export const PROTOCOL_FEES = {
  SWAP_FEE: 0.0015,
  POOLED_RESERVE_FACTOR: 0.15,
  P2P_CREATION_FEE: 0.005,
  LIQUIDATION_BONUS: 0.05,
};

export const COMMON_TOKENS = [
  {
    symbol: 'MATIC',
    name: 'Polygon',
    address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    decimals: 18,
    logo_url: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    decimals: 6,
    logo_url: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    decimals: 6,
    logo_url: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    decimals: 18,
    logo_url: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    decimals: 8,
    logo_url: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
  },
];

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  dex: string;
  path: string[];
  priceImpact: number;
  protocolFee: number;
  estimatedGas: string;
}

export async function getAggregatedQuote(
  fromToken: string,
  toToken: string,
  amount: string
): Promise<SwapQuote> {
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockToAmount = (parseFloat(amount) * 0.998).toString();

  return {
    fromToken,
    toToken,
    fromAmount: amount,
    toAmount: mockToAmount,
    dex: '1inch',
    path: [fromToken, toToken],
    priceImpact: 0.12,
    protocolFee: PROTOCOL_FEES.SWAP_FEE,
    estimatedGas: '150000',
  };
}

export async function executeSwap(
  _quote: SwapQuote,
  _userAddress: string,
  _instantYieldEnabled: boolean = false
): Promise<{ txHash: string; success: boolean }> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    txHash: `0x${Math.random().toString(16).slice(2)}`,
    success: true,
  };
}

export async function supplyToPool(
  _tokenAddress: string,
  _amount: string,
  _userAddress: string
): Promise<{ txHash: string; success: boolean }> {
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    txHash: `0x${Math.random().toString(16).slice(2)}`,
    success: true,
  };
}

export async function borrowFromPool(
  _tokenAddress: string,
  _amount: string,
  _userAddress: string
): Promise<{ txHash: string; success: boolean }> {
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    txHash: `0x${Math.random().toString(16).slice(2)}`,
    success: true,
  };
}

export async function createP2POffer(
  _lendToken: string,
  _collateralToken: string,
  _lendAmount: string,
  _interestRate: number,
  _durationDays: number,
  _collateralRatio: number,
  _userAddress: string
): Promise<{ txHash: string; success: boolean; offerId: string }> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    txHash: `0x${Math.random().toString(16).slice(2)}`,
    success: true,
    offerId: `offer-${Date.now()}`,
  };
}

export async function acceptP2POffer(
  _offerId: string,
  _userAddress: string
): Promise<{ txHash: string; success: boolean; loanId: string }> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    txHash: `0x${Math.random().toString(16).slice(2)}`,
    success: true,
    loanId: `loan-${Date.now()}`,
  };
}
