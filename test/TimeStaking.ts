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
    expect(newAPY).to.equal(30n);
  });
  it("Should Not Go Higher Than Require Range", async function () {
    await expect(contract.changeAPY(31)).to.be.revertedWith(
      "APY Limit Exceeded",
    );
  });
  it("Should Let User Stake With 20 Days And 4 ETH", async function () {
    await expect(
      contract.connect(otherUser).stake(20, { value: parseEther("4") }),
    ).to.emit(contract, "UserStaked");
    const userStatus = await contract.userStatus(otherUser.address);
    console.log(`User Status  : ${userStatus}`);
  });
  it("Should Not Let User Stake Again When It Already Staked",async function(){
    contract.connect(otherUser).stake(20, { value: parseEther("4") });
    await expect(contract.connect(otherUser).stake(20, { value: parseEther("4") })).to.be.revertedWithCustomError(contract,"alreadyStaked");
  })
  it("Should Revert With 0 Value", async function () {
    await expect(
      contract.connect(otherUser).stake(30, { value: parseEther("0") }),
    ).to.be.revertedWithCustomError(contract, "InvalidAmount");
  });
  it("Should Not Let Withdraw Without Active Stake", async function () {
    const userStatus = await contract.userStatus(otherUser);
    console.log(`User Status  : ${userStatus}`);
    await expect(contract.connect(otherUser).unstake()).to.be.revertedWith(
      "No Active Stake",
    );
  });
  it("Should Not Let Withdraw User Before Staking Time Completed", async function () {
    await contract.connect(otherUser).stake(30, { value: parseEther("30") });
    await expect(contract.connect(otherUser).unstake()).to.be.revertedWith(
      "Funds Still Locked",
    );
  });
  it("Should Not Withdraw From Contract IF The Contract Has Not Enough Liquidity",async function(){
    await contract.connect(otherUser).stake(20,{value:parseEther("20")});
    await ethers.provider.send("evm_increaseTime",[20*86400]);
    await ethers.provider.send("evm_mine",[]);
    await expect(contract.connect(otherUser).unstake()).to.be.revertedWith("Transaction Failed");
  })
  it("Should Let User Withdraw After Time Expiry", async function () {
    await contract.stake(20,{value:parseEther("30")});
    await contract.connect(otherUser).stake(30, { value: parseEther("30") });
    let currentTime = await contract.currentTime()
    console.log(`Current Time Before Increasing Time : ${currentTime}`)
    await ethers.provider.send("evm_increaseTime", [30 * 86400]);
    await ethers.provider.send("evm_mine", []);
     currentTime = await contract.currentTime()
    console.log(`Current Time After Increasing Time : ${currentTime}`)
    await expect(contract.connect(otherUser).unstake()).to.be.emit(contract,"AmountWithdraw");
  });
});
