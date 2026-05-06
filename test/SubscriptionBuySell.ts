import { expect } from "chai";
import { parseEther } from "ethers";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Buy Sell Subscription Logic", function () {
  let owner: any;
  let otherUser: any;
  let thirdUser: any;
  let contract: any;
  beforeEach(async function () {
    [owner, otherUser, , thirdUser] = await ethers.getSigners();
    contract = await ethers.deployContract("Subscription");
    await contract.addCreator(otherUser.address);
    await contract.connect(otherUser).addPlan(1, parseEther("20"), 20);
  });
  describe("Buy Subscription", function () {
    it("Should Not Let Any User Buy Subscription For Invalid Address", async function () {
      await expect(
        contract
          .connect(thirdUser)
          .buyOrRenewSubscription(ethers.ZeroAddress, 20),
      )
        .to.be.revertedWithCustomError(contract, "InvalidAddress")
        .withArgs(ethers.ZeroAddress);
    });
    it("Should Not Let Buy Subscription Of User Who Is Not Creator", async function () {
      await expect(
        contract
          .connect(thirdUser)
          .buyOrRenewSubscription(thirdUser.address, 20),
      ).to.be.revertedWithCustomError(contract,"NotTheCreator");
    });
    it("Should Not Let Buy Plan Of Creator Which Is Not Active Or Not Found", async function () {
      await contract.connect(otherUser).addPlan(2, parseEther("202"), 220);
      await contract.connect(otherUser).deactivatePlan(2);
      await expect(
        contract
          .connect(thirdUser)
          .buyOrRenewSubscription(otherUser.address, 2),
      ).to.be.revertedWith("Plan Not Active or Not Found");
      await expect(
        contract
          .connect(thirdUser)
          .buyOrRenewSubscription(otherUser.address, 20),
      ).to.be.revertedWith("Plan Not Active or Not Found");
    });
    it.only("Should Not Let User Buy Subscription Of A Creator With Different Value",async function(){
        console.log(`Ether : ${parseEther("20.000000000000000001")}\nETH : ${parseEther("19.999999999999999999")}`)
        await expect(contract.connect(thirdUser).buyOrRenewSubscription(otherUser.address,1,{value:parseEther("2")})).to.be.revertedWith("Make sure To Send Same Amount Of User");
        await expect(contract.connect(thirdUser).buyOrRenewSubscription(otherUser.address,1,{value:parseEther("19")})).to.be.revertedWith("Make sure To Send Same Amount Of User");
        await expect(contract.connect(thirdUser).buyOrRenewSubscription(otherUser.address,1,{value:parseEther("21")})).to.be.revertedWith("Make sure To Send Same Amount Of User");
        await expect(contract.connect(thirdUser).buyOrRenewSubscription(otherUser.address,1,{value:parseEther("19.999999999999999999")})).to.be.revertedWith("Make sure To Send Same Amount Of User");
        await expect(contract.connect(thirdUser).buyOrRenewSubscription(otherUser.address,1,{value:parseEther("20.000000000000000001")})).to.be.revertedWith("Make sure To Send Same Amount Of User");
    })
  });
  describe("Gift Subscription", function () {});
});
