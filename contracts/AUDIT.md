# Audit Readiness Checklist

This protocol must be audited by an independent firm before mainnet. Use this checklist when preparing the engagement and when reviewing the report.

## Scope (in order of risk)

1. **TwinFlameLending** — collateral math, liquidation engine, P2P offer flow, interest accrual
2. **TwinFlameSwap** — LP share accounting, fee routing, oracle dependency
3. **EQTDividendDistributor** — snapshot model, claim accounting, double-claim prevention
4. **FeeDistributor** — keeper trust assumptions, burn paths
5. **EQTToken** — ERC-1404 restriction completeness, mint cap, KYC integrity
6. **BlazeToken / EmberToken** — anti-whale exemptions, supply cap enforcement
7. **Governance** — Governor + Timelock wiring, role separation

## Known design trade-offs (call out to auditors)

- **Interest accrual is linear** in `TwinFlameLending`. For mainnet, replace with index-based accrual (Compound `borrowIndex`) so partial repayments and pooled accounting are precise.
- **`PriceOracle` is admin-set.** Plan: wire each token to a Chainlink `AggregatorV3` feed before mainnet; keep admin override as fallback only.
- **`FeeDistributor.distributeSplit` requires keeper-pre-swapped fees.** A trustless conversion path (UniswapV3 router integration) should be added.
- **EQT dividend snapshots are operator-submitted.** A trust-minimized alternative is to use `ERC20Snapshot`/`Checkpoints` and have the contract read on-chain balances at a frozen block.
- **`TwinFlameSwap` holds full reserves**; not an AMM. Suitable for fixed-rate trinity pairs but should integrate Uniswap/Balancer for general-purpose liquidity.

## Pre-audit hardening

- [ ] All external calls use `SafeERC20` ✅
- [ ] All state-changing externals use `nonReentrant` ✅
- [ ] Admin-only functions gated by `AccessControl` roles ✅
- [ ] Pause switches on tokens, swap, lending ✅
- [ ] Custom errors instead of revert strings ✅
- [ ] `block.timestamp` used only where ±15s tolerance is acceptable ✅
- [ ] No `tx.origin` checks ✅
- [ ] No unbounded loops in user-callable functions ✅
- [ ] Events emitted on every state change ✅
- [ ] NatSpec on all externals (extend before audit)
- [ ] Slither / Mythril / Foundry invariant tests run clean
- [ ] Fork tests against Polygon mainnet (USDC, real LPs)
- [ ] Echidna fuzz suite for swap/lending math
- [ ] Gas snapshot baselined
- [ ] Multisig (Safe) set as `DEFAULT_ADMIN_ROLE` on all contracts post-deploy

## Post-audit

- [ ] All Critical/High findings remediated and re-reviewed
- [ ] Medium findings either fixed or formally accepted
- [ ] Bug bounty program live (Immunefi tier ≥ $100k)
- [ ] Timelock minDelay set to 48h+
- [ ] `DEFAULT_ADMIN_ROLE` transferred from EOA to Gnosis Safe (3-of-5 minimum)
- [ ] Renounce or restrict all initialization-only roles
- [ ] Frontend updated with deployed addresses, ABI imported from `artifacts/`
