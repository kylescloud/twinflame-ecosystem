import { expect } from "chai";
import { ethers } from "hardhat";

describe("BlazeToken", () => {
  it("mints fixed supply and enforces 1% anti-whale", async () => {
    const [admin, treasury, alice, bob] = await ethers.getSigners();
    const Blaze = await ethers.getContractFactory("BlazeToken");
    const blaze = await Blaze.deploy(admin.address, treasury.address);

    expect(await blaze.totalSupply()).to.equal(ethers.parseEther("10000000"));
    expect(await blaze.balanceOf(treasury.address)).to.equal(ethers.parseEther("10000000"));

    // treasury is exempt — sending to alice (non-exempt) is fine since sender exempt
    await blaze.connect(treasury).transfer(alice.address, ethers.parseEther("200000"));

    // alice → bob: both non-exempt; max = 1% of 10M = 100k
    await expect(
      blaze.connect(alice).transfer(bob.address, ethers.parseEther("150000"))
    ).to.be.revertedWithCustomError(blaze, "ExceedsTxLimit");

    await blaze.connect(alice).transfer(bob.address, ethers.parseEther("50000"));
    expect(await blaze.balanceOf(bob.address)).to.equal(ethers.parseEther("50000"));
  });
});

describe("EQTToken", () => {
  it("blocks non-KYC transfers and allows after approval", async () => {
    const [admin, alice, bob] = await ethers.getSigners();
    const EQT = await ethers.getContractFactory("EQTToken");
    const eqt = await EQT.deploy(admin.address);

    await eqt.mint(admin.address, ethers.parseEther("1000"));

    // admin → alice (alice not KYC) — reverts
    await expect(eqt.transfer(alice.address, 1n)).to.be.revertedWithCustomError(eqt, "TransferRestricted");

    await eqt.setKYC(alice.address, true);
    await eqt.transfer(alice.address, ethers.parseEther("10"));
    expect(await eqt.balanceOf(alice.address)).to.equal(ethers.parseEther("10"));

    await eqt.setSanctioned(alice.address, true);
    await expect(eqt.connect(alice).transfer(admin.address, 1n)).to.be.revertedWithCustomError(eqt, "TransferRestricted");
  });
});

describe("FeeDistributor split", () => {
  it("computes 50/30/20 of gross fee", async () => {
    const [admin] = await ethers.getSigners();
    const Blaze = await ethers.getContractFactory("BlazeToken");
    const blaze = await Blaze.deploy(admin.address, admin.address);
    const Ember = await ethers.getContractFactory("EmberToken");
    const ember = await Ember.deploy(admin.address);
    const FD = await ethers.getContractFactory("FeeDistributor");
    const fd = await FD.deploy(admin.address, await blaze.getAddress(), await ember.getAddress(), admin.address, admin.address, admin.address);
    const [b, r, d] = await fd.splitOf(1000n);
    expect(b).to.equal(500n);
    expect(r).to.equal(300n);
    expect(d).to.equal(200n);
  });
});
