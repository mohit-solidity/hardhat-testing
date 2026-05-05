import { expect } from "chai";
import { parseEther } from "ethers";
import { network } from "hardhat";

const { ethers } = await network.create();
describe("Add/Remove creators", function () {
  let contract: any;
  let owner: any;
  let otherUser: any;
  let thirdUser: any;
  beforeEach(async function () {
    [owner, otherUser, thirdUser] = await ethers.getSigners();
    contract = await ethers.deployContract("Subscription");
  });
  describe("Owner Functions", function () {
    it("Owner Can Add New User Creator", async function () {
      await expect(contract.addCreator(thirdUser.address)).to.emit(
        contract,
        "CreatorAdded",
      ).withArgs(thirdUser.address);
      const isCreator = await contract.isCreator(thirdUser.address);
      expect(isCreator).to.equal(true);
    });
    it("Should Not Let Owner Add Invalid Address", async function () {
      await expect(contract.addCreator(ethers.ZeroAddress)).to.be.revertedWith(
        "Invalid Address",
      );
    });
    it("Should Let Owner Only To Remove The Creator", async function () {
      //Owner Removed The Creator
      await expect(contract.removeCreator(owner.address)).to.emit(
        contract,
        "CreatorRemoved",
      ).withArgs(owner.address);
      const isCreator = await contract.isCreator(owner.address);
      expect(isCreator).to.equal(false);
    });
    it("Owner Can't Remove The Creator Who is Not Registered", async function () {
      await expect(
        contract.removeCreator(otherUser.address),
      ).to.be.revertedWithCustomError(contract, "NotTheCreator");
    });
    it("Should Not Let Owner To Add Same Creator Again", async function () {
      await contract.addCreator(thirdUser.address);
      await expect(contract.addCreator(thirdUser.address)).to.be.revertedWith(
        "Already The Creator",
      );
    });
    it("Should Not Let Owner Add Creator When The Contract Is Paused", async function () {
      const paused = await contract.pauseContract();
      await expect(contract.addCreator(owner.address)).to.be.revertedWith(
        "Contract Is Paused",
      );
    });
  });
  describe("Normal User Access Owner Controls", function () {
    it("Should not let any other user to add any creator", async function () {
      await expect(
        contract.connect(otherUser).addCreator(owner.address),
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
    it("Other Normal User Can't Remove The Creator", async function () {
      await expect(
        contract.connect(otherUser).removeCreator(thirdUser.address),
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
  });
});
