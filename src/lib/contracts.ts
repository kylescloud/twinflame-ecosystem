import { Contract, BrowserProvider, parseUnits, formatUnits } from "ethers";

// ── Polygon Mainnet Contract Addresses (placeholder until deployment) ──
export const CONTRACTS = {
  BLAZE_TOKEN: "0x0000000000000000000000000000000000000001",
  EMBER_TOKEN: "0x0000000000000000000000000000000000000002",
  EQT_TOKEN: "0x0000000000000000000000000000000000000003",
  TWINFLAME_SWAP: "0x0000000000000000000000000000000000000010",
  TWINFLAME_LENDING: "0x0000000000000000000000000000000000000020",
  PRICE_ORACLE: "0x0000000000000000000000000000000000000030",
  FEE_DISTRIBUTOR: "0x0000000000000000000000000000000000000031",
  BLAZE_GOVERNOR: "0x0000000000000000000000000000000000000040",
  EQT_GOVERNOR: "0x0000000000000000000000000000000000000041",
  TIMELOCK: "0x0000000000000000000000000000000000000042",
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
  // Production lending views
  "function amountOwed(uint256 loanId) view returns (uint256)",
  "function healthFactor(uint256 loanId) view returns (uint256 hfE18)",
  "function userHealthFactor(address user) view returns (uint256 hfE18)",
  "function maxBorrow(address token, address collateralToken, uint256 collateralAmount) view returns (uint256)",
  "function previewLiquidation(uint256 loanId) view returns (uint256 owed, uint256 toLiquidator, uint256 refund)",
  "function loansLength() view returns (uint256)",
  "function offersLength() view returns (uint256)",
  "function getUserLoans(address user) view returns (uint256[])",
  "function collateralFactorBps() view returns (uint16)",
  "function liquidationThresholdBps() view returns (uint16)",
];

// ── Price Oracle ABI ──
export const ORACLE_ABI = [
  "function getPriceUSD(address token) view returns (uint256 priceE18)",
  "function getFeed(address token) view returns (uint256 priceE18, uint256 updatedAt, bool stale)",
  "function getTokens() view returns (address[])",
  "function tokensLength() view returns (uint256)",
  "function maxStaleness() view returns (uint256)",
  "function setPriceUSD(address token, uint256 priceE18)",
  "function batchSetPriceUSD(address[] tokens, uint256[] pricesE18)",
  "function setMaxStaleness(uint256 s)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function FEEDER_ROLE() view returns (bytes32)",
  "event PriceUpdated(address indexed token, uint256 priceE18, uint256 timestamp)",
];

// ── OpenZeppelin Governor ABI (BLAZE + EQT governors share interface) ──
export const GOVERNOR_ABI = [
  "function name() view returns (string)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
  "function proposalThreshold() view returns (uint256)",
  "function quorum(uint256 blockNumber) view returns (uint256)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalSnapshot(uint256 proposalId) view returns (uint256)",
  "function proposalDeadline(uint256 proposalId) view returns (uint256)",
  "function proposalEta(uint256 proposalId) view returns (uint256)",
  "function proposalProposer(uint256 proposalId) view returns (address)",
  "function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function proposalNeedsQueuing(uint256 proposalId) view returns (bool)",
  "function hashProposal(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) view returns (uint256)",
  "function hasVoted(uint256 proposalId, address account) view returns (bool)",
  "function getVotes(address account, uint256 blockNumber) view returns (uint256)",
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)",
  "function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)",
  "function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) payable returns (uint256)",
  "function cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)",
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)",
  "event ProposalQueued(uint256 proposalId, uint256 etaSeconds)",
  "event ProposalExecuted(uint256 proposalId)",
  "event ProposalCanceled(uint256 proposalId)",
  "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)",
];

// ── OpenZeppelin TimelockController ABI ──
export const TIMELOCK_ABI = [
  "function getMinDelay() view returns (uint256)",
  "function isOperation(bytes32 id) view returns (bool)",
  "function isOperationPending(bytes32 id) view returns (bool)",
  "function isOperationReady(bytes32 id) view returns (bool)",
  "function isOperationDone(bytes32 id) view returns (bool)",
  "function getTimestamp(bytes32 id) view returns (uint256)",
];

// ── Governor proposal-state enum (matches IGovernor.ProposalState) ──
export const PROPOSAL_STATE = [
  "Pending", "Active", "Canceled", "Defeated", "Succeeded",
  "Queued", "Expired", "Executed",
] as const;
export type ProposalStateName = typeof PROPOSAL_STATE[number];

// ── Vote support enum (GovernorCountingSimple) ──
export const VOTE_SUPPORT = { Against: 0, For: 1, Abstain: 2 } as const;

// ── Health factor color tier (frontend gauge) ──
export function healthFactorTier(hf: number): "safe" | "warn" | "danger" {
  if (hf >= 1.5) return "safe";
  if (hf >= 1.2) return "warn";
  return "danger";
}

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
