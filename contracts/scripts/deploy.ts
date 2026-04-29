import { ethers, network, run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Full TwinFlame protocol deployment.
 * Network presets: hardhat / amoy / polygon
 *
 * Required env vars:
 *   PRIVATE_KEY        - deployer key
 *   USDC_ADDRESS       - USDC on target chain (Polygon: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359)
 *   TREASURY_ADDRESS   - receives initial BLAZE supply
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const admin = deployer.address;
  const treasury = process.env.TREASURY_ADDRESS && process.env.TREASURY_ADDRESS !== ethers.ZeroAddress
    ? process.env.TREASURY_ADDRESS
    : admin;
  const usdcAddress = process.env.USDC_ADDRESS;

  console.log(`\n🔥 Deploying TwinFlame on ${network.name} from ${admin}`);
  console.log(`   Treasury: ${treasury}`);
  console.log(`   USDC:     ${usdcAddress}\n`);

  if (!usdcAddress) throw new Error("USDC_ADDRESS env var required");

  // 1. Tokens
  const Blaze = await ethers.getContractFactory("BlazeToken");
  const blaze = await Blaze.deploy(admin, treasury);
  await blaze.waitForDeployment();
  console.log(`✅ BLAZE      ${await blaze.getAddress()}`);

  const Ember = await ethers.getContractFactory("EmberToken");
  const ember = await Ember.deploy(admin);
  await ember.waitForDeployment();
  console.log(`✅ EMBER      ${await ember.getAddress()}`);

  const EQT = await ethers.getContractFactory("EQTToken");
  const eqt = await EQT.deploy(admin);
  await eqt.waitForDeployment();
  console.log(`✅ EQT        ${await eqt.getAddress()}`);

  // 2. Oracle
  const Oracle = await ethers.getContractFactory("PriceOracle");
  const oracle = await Oracle.deploy(admin);
  await oracle.waitForDeployment();
  console.log(`✅ Oracle     ${await oracle.getAddress()}`);

  // Seed prices: BLAZE=$0.10, EMBER=$0.095, EQT=$1.00
  await (await oracle.batchSetPriceUSD(
    [await blaze.getAddress(), await ember.getAddress(), await eqt.getAddress()],
    [ethers.parseEther("0.10"), ethers.parseEther("0.095"), ethers.parseEther("1.0")],
  )).wait();
  console.log(`   Seeded oracle prices`);

  // 3. Distributors (FeeDistributor needs rewards & dividend addresses; deploy in two passes)
  const Rewards = await ethers.getContractFactory("EmberRewardsDistributor");
  const rewards = await Rewards.deploy(admin, await ember.getAddress(), await blaze.getAddress());
  await rewards.waitForDeployment();
  console.log(`✅ Rewards    ${await rewards.getAddress()}`);

  const Dividends = await ethers.getContractFactory("EQTDividendDistributor");
  const dividends = await Dividends.deploy(admin, await eqt.getAddress(), usdcAddress);
  await dividends.waitForDeployment();
  console.log(`✅ Dividends  ${await dividends.getAddress()}`);

  const FeeDist = await ethers.getContractFactory("FeeDistributor");
  const feeDist = await FeeDist.deploy(
    admin,
    await blaze.getAddress(),
    await ember.getAddress(),
    usdcAddress,
    await rewards.getAddress(),
    await dividends.getAddress(),
  );
  await feeDist.waitForDeployment();
  console.log(`✅ FeeDist    ${await feeDist.getAddress()}`);

  // 4. Swap & Lending
  const Swap = await ethers.getContractFactory("TwinFlameSwap");
  const swap = await Swap.deploy(
    admin,
    await blaze.getAddress(),
    await ember.getAddress(),
    await eqt.getAddress(),
    await oracle.getAddress(),
    await feeDist.getAddress(),
  );
  await swap.waitForDeployment();
  console.log(`✅ Swap       ${await swap.getAddress()}`);

  const Lending = await ethers.getContractFactory("TwinFlameLending");
  const lending = await Lending.deploy(admin, await oracle.getAddress(), await feeDist.getAddress());
  await lending.waitForDeployment();
  console.log(`✅ Lending    ${await lending.getAddress()}`);

  // 5. Wire roles
  // EMBER mint role to rewards distributor (so it can mint future emissions if desired)
  const MINTER = await ember.MINTER_ROLE();
  await (await ember.grantRole(MINTER, await rewards.getAddress())).wait();
  // KEEPER role on FeeDistributor to swap router
  const KEEPER = await feeDist.KEEPER_ROLE();
  await (await feeDist.grantRole(KEEPER, await swap.getAddress())).wait();
  await (await feeDist.grantRole(KEEPER, await lending.getAddress())).wait();
  // Anti-whale exemptions for protocol contracts
  await (await blaze.setLimitExempt(await swap.getAddress(), true)).wait();
  await (await blaze.setLimitExempt(await lending.getAddress(), true)).wait();
  await (await blaze.setLimitExempt(await feeDist.getAddress(), true)).wait();
  await (await ember.setLimitExempt(await swap.getAddress(), true)).wait();
  await (await ember.setLimitExempt(await lending.getAddress(), true)).wait();
  await (await ember.setLimitExempt(await feeDist.getAddress(), true)).wait();
  // EQT KYC for protocol contracts
  await (await eqt.setKYC(await swap.getAddress(), true)).wait();
  await (await eqt.setKYC(await lending.getAddress(), true)).wait();
  await (await eqt.setKYC(await dividends.getAddress(), true)).wait();
  console.log(`   Wired roles & exemptions`);

  // 6. Governance (Timelock + 2 governors)
  const Timelock = await ethers.getContractFactory("TwinFlameTimelock");
  const timelock = await Timelock.deploy(
    2 * 24 * 60 * 60, // 48h
    [admin],
    [admin],
    admin,
  );
  await timelock.waitForDeployment();
  console.log(`✅ Timelock   ${await timelock.getAddress()}`);

  const BlazeGov = await ethers.getContractFactory("BlazeGovernor");
  const blazeGov = await BlazeGov.deploy(await blaze.getAddress(), await timelock.getAddress());
  await blazeGov.waitForDeployment();
  console.log(`✅ BlazeGov   ${await blazeGov.getAddress()}`);

  const EQTGov = await ethers.getContractFactory("EQTGovernor");
  const eqtGov = await EQTGov.deploy(await eqt.getAddress(), await timelock.getAddress());
  await eqtGov.waitForDeployment();
  console.log(`✅ EQTGov     ${await eqtGov.getAddress()}`);

  // 7. Persist deployment
  const out = {
    network: network.name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: admin,
    treasury,
    usdc: usdcAddress,
    contracts: {
      BlazeToken: await blaze.getAddress(),
      EmberToken: await ember.getAddress(),
      EQTToken: await eqt.getAddress(),
      PriceOracle: await oracle.getAddress(),
      FeeDistributor: await feeDist.getAddress(),
      EmberRewardsDistributor: await rewards.getAddress(),
      EQTDividendDistributor: await dividends.getAddress(),
      TwinFlameSwap: await swap.getAddress(),
      TwinFlameLending: await lending.getAddress(),
      TwinFlameTimelock: await timelock.getAddress(),
      BlazeGovernor: await blazeGov.getAddress(),
      EQTGovernor: await eqtGov.getAddress(),
    },
    timestamp: new Date().toISOString(),
  };

  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${network.name}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`\n📦 Deployment saved to ${file}`);
  console.log(`\nNext: pnpm verify:${network.name}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
