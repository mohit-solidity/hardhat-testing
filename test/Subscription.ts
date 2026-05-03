import { expect } from "chai";
import { parseEther } from "ethers";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Subscription", function () {
  let owner;
  let otherUser: any;
  let contract: any;
  before(async function () {
    [owner, otherUser] = await ethers.getSigners();
    contract = await ethers.deployContract("Subscription");
  });
  it("Should Only Owner Can Call The Function pause Contract", async function () {
    await expect(contract.pauseContract()).to.be.emit(
      contract,
      "ContractPaused",
    );
  });
  it("Should Not Let Another User Pause Contract", async function () {
    await expect(
      contract.connect(otherUser).pauseContract(),
    ).to.be.revertedWithCustomError(contract,"OwnableUnauthorizedAccount");
  });
});
