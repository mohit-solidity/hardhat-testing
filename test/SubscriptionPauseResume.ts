import { expect } from "chai";
import { parseEther } from "ethers";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Pause/Resume And Fee Contract", function () {
  let owner: any;
  let otherUser: any;
  let thirdUser: any;
  let contract: any;
  beforeEach(async function () {
    [owner, otherUser, thirdUser] = await ethers.getSigners();
    contract = await ethers.deployContract("Subscription");
  });
  describe("Owner Functions", function () {
    it("Only Owner Can Change The Fee", async function () {
      await contract.changeFee(700);
      expect(await contract.feeAPY()).to.equal(700n);
    });
    it("Owner Can Change Max Fee To 10% And Min To 1%", async function () {
      await contract.changeFee(1000);
      let fee = await contract.feeAPY();
      expect(fee).to.equal(1000n);
      await contract.changeFee(100);
      fee = await contract.feeAPY();
      expect(fee).to.equal(100n);
    });
    it("Owner Can't Change Fee Greater Than 10%(1000) And Less Than 1%", async function () {
      await expect(contract.changeFee(1001)).to.be.revertedWith(
        "Max Fee Is 10% And Minimum Is 1%",
      );
      await expect(contract.changeFee(0)).to.be.revertedWith(
        "Max Fee Is 10% And Minimum Is 1%",
      );
    });
  });
  describe("Pause/Resume Contact", function () {
    it("Only Owner Can Call The Function pause Contract", async function () {
      const tx = await contract.pauseContract();
      let b = await tx.wait();
      let time = await ethers.provider.getBlock(b.blockNummber);
      console.log(`Block : ${time?.gasUsed}`);
      await expect(tx)
        .to.emit(contract, "ContractPaused")
        .withArgs(time?.timestamp);
    });
    it("Owner Can-not Pause Again After Pausing", async function () {
      await expect(contract.pauseContract()).to.be.revertedWith(
        "Already Paused",
      );
    });
    it("Only Owner Can Call The Function Resume Contract After It Paused", async function () {
      await expect(contract.resumeContract()).to.emit(
        contract,
        "ContractResumed",
      );
    });
    it("Should Not Let Another User Pause Contract", async function () {
      await expect(
        contract.connect(otherUser).pauseContract(),
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
    it("Should Not Let Another User Resume Contract", async function () {
      await expect(
        contract.connect(otherUser).resumeContract(),
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
  });
});
