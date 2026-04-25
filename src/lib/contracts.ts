import { Contract, BrowserProvider, parseUnits, formatUnits } from "ethers";

// ── Polygon Mainnet Contract Addresses (placeholder until deployment) ──
export const CONTRACTS = {
  BLAZE_TOKEN: "0x0000000000000000000000000000000000000001",
  EMBER_TOKEN: "0x0000000000000000000000000000000000000002",
  EQT_TOKEN: "0x0000000000000000000000000000000000000003",
  TWINFLAME_SWAP: "0x0000000000000000000000000000000000000010",
  TWINFLAME_LENDING: "0x0000000000000000000000000000000000000020",
} as const;

// ── ERC20 ABI (minimal) ──
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

// ── TwinFlame Swap Router ABI ──
export const SWAP_ROUTER_ABI = [
  // Swap functions
  "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) returns (uint256 amountOut)",
  "function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256 amountOut, uint256 fee)",
  "function getRate(address tokenIn, address tokenOut) view returns (uint256 rate)",
  // Fee info
  "function protocolFeeRate() view returns (uint256)",
  "function burnShare() view returns (uint256)",
  "function rewardShare() view returns (uint256)",
  "function dividendShare() view returns (uint256)",
  // Events
  "event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee)",
  "event FeesDistributed(uint256 burned, uint256 rewarded, uint256 dividends)",
];

// ── TwinFlame Lending Pool ABI ──
export const LENDING_POOL_ABI = [
  // Pool lending
  "function deposit(address token, uint256 amount) returns (bool)",
  "function withdraw(address token, uint256 amount) returns (bool)",
  "function borrow(address token, uint256 amount, address collateralToken, uint256 collateralAmount) returns (uint256 loanId)",
  "function repay(uint256 loanId) returns (bool)",
  "function liquidate(uint256 loanId) returns (bool)",
  // P2P lending
  "function createLoanOffer(address token, uint256 amount, uint256 interestRate, uint256 duration, address collateralToken, uint256 minCollateral) returns (uint256 offerId)",
  "function fillLoanOffer(uint256 offerId, address collateralToken, uint256 collateralAmount) returns (uint256 loanId)",
  "function cancelLoanOffer(uint256 offerId) returns (bool)",
  // Views
  "function getPoolInfo(address token) view returns (uint256 totalDeposits, uint256 totalBorrowed, uint256 utilizationRate, uint256 supplyAPY, uint256 borrowAPY)",
  "function getLoan(uint256 loanId) view returns (address borrower, address token, uint256 amount, address collateralToken, uint256 collateralAmount, uint256 interestRate, uint256 dueDate, bool repaid, bool liquidated)",
  "function getLoanOffer(uint256 offerId) view returns (address lender, address token, uint256 amount, uint256 interestRate, uint256 duration, address collateralToken, uint256 minCollateral, bool active)",
  "function getUserDeposits(address user, address token) view returns (uint256)",
  "function getUserBorrows(address user) view returns (uint256[] loanIds)",
  "function collateralFactor() view returns (uint256)",
  "function protocolFeeRate() view returns (uint256)",
  // Events
  "event Deposit(address indexed user, address indexed token, uint256 amount)",
  "event Withdraw(address indexed user, address indexed token, uint256 amount)",
  "event Borrow(address indexed user, uint256 indexed loanId, address token, uint256 amount)",
  "event Repay(address indexed user, uint256 indexed loanId)",
  "event Liquidate(uint256 indexed loanId, address indexed liquidator)",
  "event LoanOfferCreated(uint256 indexed offerId, address indexed lender)",
  "event LoanOfferFilled(uint256 indexed offerId, uint256 indexed loanId, address indexed borrower)",
];

// ── Token Metadata ──
export const TOKEN_INFO = {
  BLAZE: { address: CONTRACTS.BLAZE_TOKEN, symbol: "BLAZE", decimals: 18 },
  EMBER: { address: CONTRACTS.EMBER_TOKEN, symbol: "EMBER", decimals: 18 },
  EQT: { address: CONTRACTS.EQT_TOKEN, symbol: "EQT", decimals: 18 },
} as const;

// ── Fee Distribution (per whitepaper) ──
export const FEE_CONFIG = {
  PROTOCOL_FEE_BPS: 30, // 0.3% = 30 basis points
  BURN_SHARE: 50,       // 50% of fees → BLAZE buyback-and-burn
  REWARD_SHARE: 30,     // 30% of fees → buy EMBER for staker rewards
  DIVIDEND_SHARE: 20,   // 20% of fees → EQT dividend pool
} as const;

// ── Lending Config ──
export const LENDING_CONFIG = {
  MIN_COLLATERAL_RATIO: 150, // 150% over-collateralization
  LIQUIDATION_THRESHOLD: 120, // liquidate at 120%
  PROTOCOL_FEE_BPS: 30, // 0.3% fee on lending
  MAX_LOAN_DURATION_DAYS: 365,
} as const;

// ── Helper: get contract instance ──
export function getContract(address: string, abi: string[], provider: BrowserProvider) {
  return new Contract(address, abi, provider);
}

export async function getSignedContract(address: string, abi: string[], provider: BrowserProvider) {
  const signer = await provider.getSigner();
  return new Contract(address, abi, signer);
}

// ── Native TwinFlame token USD anchor prices (used for cross-pair calc) ──
export const NATIVE_USD_PRICES: Record<string, number> = {
  BLAZE: 0.10,   // $0.10 anchor
  EMBER: 0.095,  // ~5% discount vs BLAZE → preserves 1 BLAZE = 1.05 EMBER
  EQT: 1.00,     // $1.00 dividend-bearing security token
};

// ── Simulated swap calculation (used when contracts aren't deployed) ──
// For native trinity pairs, uses fixed protocol rates. For all other tokens,
// uses live USD prices (passed in) to derive an output amount.
export function simulateSwap(
  tokenIn: string,
  tokenOut: string,
  amountIn: number,
  priceInUsd?: number,
  priceOutUsd?: number,
): { amountOut: number; fee: number; burnAmount: number; rewardAmount: number; dividendAmount: number } {
  let rate = 0;
  // ── Fixed protocol rates for native trinity pairs ──
  if (tokenIn === "BLAZE" && tokenOut === "EMBER") rate = 1.05;
  else if (tokenIn === "EMBER" && tokenOut === "BLAZE") rate = 0.9;
  else if (tokenIn === "BLAZE" && tokenOut === "EQT") rate = 0.1;   // 10 BLAZE = 1 EQT
  else if (tokenIn === "EQT" && tokenOut === "BLAZE") rate = 10;
  else if (tokenIn === "EMBER" && tokenOut === "EQT") rate = 0.105;
  else if (tokenIn === "EQT" && tokenOut === "EMBER") rate = 9.5;
  else if (tokenIn === tokenOut) rate = 1;
  else {
    // ── USD price-derived rate for any other token pair ──
    const pIn = priceInUsd ?? NATIVE_USD_PRICES[tokenIn];
    const pOut = priceOutUsd ?? NATIVE_USD_PRICES[tokenOut];
    if (pIn && pOut && pOut > 0) {
      rate = pIn / pOut;
    } else {
      rate = 1; // fallback when prices unavailable
    }
  }

  const gross = amountIn * rate;
  const feeRate = FEE_CONFIG.PROTOCOL_FEE_BPS / 10000;
  const fee = gross * feeRate;
  const amountOut = gross - fee;

  return {
    amountOut,
    fee,
    burnAmount: fee * (FEE_CONFIG.BURN_SHARE / 100),
    rewardAmount: fee * (FEE_CONFIG.REWARD_SHARE / 100),
    dividendAmount: fee * (FEE_CONFIG.DIVIDEND_SHARE / 100),
  };
}
