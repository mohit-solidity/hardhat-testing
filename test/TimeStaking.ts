import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("TimeStaking", function () {
  it("Should Not Call Without Owner Permission", async function () {
    const [owner, otherUser] = await ethers.getSigners();
    const counter = await ethers.deployContract("TimeStaking", [10]);
    const otheruser = counter.connect(otherUser);
    await expect(otheruser.ownerWithdraw()).to.be.revertedWith(
      "Not Authorised",
    );
  });
  it("Should Run Correctly", async function () {
    const [owner, otherUser] = await ethers.getSigners();
    const counter = await ethers.deployContract("TimeStaking", [10]);
    await expect(counter.ownerWithdraw());
  });
});
