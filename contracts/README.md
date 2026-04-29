# TwinFlame Protocol Smart Contracts

Production-grade scaffold for the TwinFlame DeFi ecosystem on Polygon.
Built with **Solidity 0.8.24**, **OpenZeppelin v5**, and **Hardhat**.

> ⚠️ **Audit required.** This is an audit-ready starting point. **Do not deploy to mainnet without a professional security audit** (CertiK, Trail of Bits, OpenZeppelin, ConsenSys Diligence, etc.).

## Contracts

| Contract | Purpose |
|---|---|
| `tokens/BlazeToken.sol` | Fixed-supply 10M governance token. ERC20Votes + Permit + 1% anti-whale + burn. |
| `tokens/EmberToken.sol` | Uncapped reward/utility token. Mintable by `MINTER_ROLE`. |
| `tokens/EQTToken.sol` | KYC-gated security token (ERC-1404 style restrictions). 1M cap. ERC20Votes. |
| `protocol/PriceOracle.sol` | Manual + Chainlink-ready USD price feed registry with staleness checks. |
| `protocol/TwinFlameSwap.sol` | Router with fixed trinity rates + oracle-derived rates. 0.30% fee. LP shares. |
| `protocol/TwinFlameLending.sol` | Pooled + P2P lending, shared liquidation engine, 150% CR / 120% liq. |
| `protocol/FeeDistributor.sol` | Routes fees per 50/30/20 (BLAZE burn / EMBER rewards / EQT USDC dividends). |
| `protocol/EmberRewardsDistributor.sol` | Synthetix-style staker rewards in EMBER. |
| `protocol/EQTDividendDistributor.sol` | Pull-based USDC dividend epochs to EQT holders. |
| `governance/TwinFlameTimelock.sol` | 48h `TimelockController`. |
| `governance/BlazeGovernor.sol` | OZ Governor on BLAZE. 7d voting, 4% quorum, 100k threshold. |
| `governance/EQTGovernor.sol` | OZ Governor on EQT. 7d voting, 10% quorum, 1k threshold. |

## Setup

```bash
cd contracts
cp .env.example .env   # fill in PRIVATE_KEY, USDC_ADDRESS, etc.
npm install            # or pnpm / bun
npm run compile
npm test
```

## Deploy

```bash
# Local
npm run node            # in one terminal
npm run deploy:local    # in another

# Testnet (Polygon Amoy)
npm run deploy:amoy
npm run verify:amoy

# Mainnet (Polygon) — only after audit
npm run deploy:polygon
npm run verify:polygon
```

Deployments are saved to `deployments/<network>.json`.

## Wiring to the frontend

After deployment, copy the addresses from `deployments/<network>.json` into `src/lib/contracts.ts`:

```ts
export const CONTRACTS = {
  BLAZE_TOKEN: "0x...",
  EMBER_TOKEN: "0x...",
  EQT_TOKEN: "0x...",
  TWINFLAME_SWAP: "0x...",
  TWINFLAME_LENDING: "0x...",
  // + new
  PRICE_ORACLE: "0x...",
  FEE_DISTRIBUTOR: "0x...",
  EMBER_REWARDS: "0x...",
  EQT_DIVIDENDS: "0x...",
  TIMELOCK: "0x...",
  BLAZE_GOVERNOR: "0x...",
  EQT_GOVERNOR: "0x...",
} as const;
```

See `AUDIT.md` for the security checklist.
