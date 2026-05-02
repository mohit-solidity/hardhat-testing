import { expect } from "chai";
import { parseEther } from "ethers";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("TimeStaking", function () {
  let owner;
  let otherUser: any;
  let contract: any;
  beforeEach(async function () {
    [owner, otherUser] = await ethers.getSigners();
    contract = await ethers.deployContract("TimeStaking", [10]);
  });
  it("Should Not Call Without Owner Permission", async function () {
    const otheruser = contract.connect(otherUser);
    await expect(otheruser.ownerWithdraw()).to.be.revertedWith(
      "Not Authorised",
    );
  });
  it("Should Run Correctly", async function () {
    await contract.ownerWithdraw();
  });
  it("Should Not Let Any Other User TO Change The APY", async function () {
    const u = contract.connect(otherUser);
    await expect(u.changeAPY(20)).to.be.revertedWith("Not Authorised");
  });
  it("Should Not Change APY at 0", async function () {
    await expect(contract.changeAPY(0)).to.be.revertedWith(
      "APY Limit Exceeded",
    );
  });
  it("Should Change APY at 30", async function () {
    const oldAPY = await contract.APY();
    console.log(`Old APY : ${oldAPY}`);
    await contract.changeAPY(30);
    const newAPY = await contract.APY();
    console.log(`New APY : ${newAPY}`);
  });
  it("Should Not Go Higher Than Require Range", async function () {
    await expect(contract.changeAPY(31)).to.be.revertedWith(
      "APY Limit Exceeded",
    );
  });
  it("Should Revert With 0 Value"),
    async function () {
      await expect(
        contract.stake(30, { value: parseEther("0") }),
      ).to.be.revertedWith("Error");
    };
  it("Should Not Let Withdraw Without Active Stake"),async function(){
    await expect(contract.unstake()).to.be.revertedWith("No Active Stake");
  }
});
