import { expect } from "chai";
import { parseEther } from "ethers";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("TimeStaking", function () {
  let owner;
  let otherUser: any;
  let contract: any;
  before(async function () {
    [owner, otherUser] = await ethers.getSigners();
    contract = await ethers.deployContract("TimeStaking", [30]);
    await contract.connect(otherUser).stake(20, { value: parseEther("30") });
  });
  it("Should Not Let User Stake Again", async function () {
    const user = await contract
      .connect(otherUser)
      .userStatus(otherUser.address);
    console.log(`User Status  ${user}`);
    await expect(
      contract.connect(otherUser).stake(20, { value: parseEther("30") }),
    ).to.be.revertedWithCustomError(contract, "alreadyStaked");
  });
  it("should let user withdraw His Balance", async function () {
    let time = await contract.currentTime();
    console.log(`Current Time : ${time}`);
    await ethers.provider.send("evm_increaseTime", [20 * 86400]);
    await ethers.provider.send("evm_mine", []);
    time = await contract.currentTime();
    console.log(`Current Time : ${time}`);
    await expect(contract.connect(otherUser).unstake()).to.be.emit(
      contract,
      "AmountWithdraw",
    );
  });
});
