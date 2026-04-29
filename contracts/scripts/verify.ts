import { run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const file = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  if (!fs.existsSync(file)) throw new Error(`No deployment for ${network.name}`);
  const dep = JSON.parse(fs.readFileSync(file, "utf8"));
  const c = dep.contracts;

  const verify = async (name: string, address: string, args: any[]) => {
    try {
      console.log(`Verifying ${name} @ ${address}`);
      await run("verify:verify", { address, constructorArguments: args });
    } catch (e: any) {
      console.warn(`  skip ${name}: ${e.message?.slice(0, 100)}`);
    }
  };

  await verify("BlazeToken", c.BlazeToken, [dep.deployer, dep.treasury]);
  await verify("EmberToken", c.EmberToken, [dep.deployer]);
  await verify("EQTToken", c.EQTToken, [dep.deployer]);
  await verify("PriceOracle", c.PriceOracle, [dep.deployer]);
  await verify("EmberRewardsDistributor", c.EmberRewardsDistributor, [dep.deployer, c.EmberToken, c.BlazeToken]);
  await verify("EQTDividendDistributor", c.EQTDividendDistributor, [dep.deployer, c.EQTToken, dep.usdc]);
  await verify("FeeDistributor", c.FeeDistributor, [dep.deployer, c.BlazeToken, c.EmberToken, dep.usdc, c.EmberRewardsDistributor, c.EQTDividendDistributor]);
  await verify("TwinFlameSwap", c.TwinFlameSwap, [dep.deployer, c.BlazeToken, c.EmberToken, c.EQTToken, c.PriceOracle, c.FeeDistributor]);
  await verify("TwinFlameLending", c.TwinFlameLending, [dep.deployer, c.PriceOracle, c.FeeDistributor]);
  await verify("TwinFlameTimelock", c.TwinFlameTimelock, [172800, [dep.deployer], [dep.deployer], dep.deployer]);
  await verify("BlazeGovernor", c.BlazeGovernor, [c.BlazeToken, c.TwinFlameTimelock]);
  await verify("EQTGovernor", c.EQTGovernor, [c.EQTToken, c.TwinFlameTimelock]);
}

main().catch((e) => { console.error(e); process.exit(1); });
