import { expect } from "chai";
import { formatEther, parseEther } from "ethers";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Buy Sell Subscription Logic", function () {
  let owner: any;
  let otherUser: any;
  let thirdUser: any;
  let contract: any;
  let nft: any;
  beforeEach(async function () {
    [owner, otherUser, , thirdUser] = await ethers.getSigners();
    contract = await ethers.deployContract("Subscription");
    let nftAddress = await contract.subscriptionNFT();
    const NFT = await ethers.getContractFactory("SubscriptionNFT");
    nft = await NFT.attach(nftAddress);
    await contract.addCreator(otherUser.address);
    await contract.connect(otherUser).addPlan(1, parseEther("20"), 20);
  });
  describe("Buy Subscription", function () {
    describe("Can-Not Buy", function () {
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
        ).to.be.revertedWithCustomError(contract, "NotTheCreator");
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
      it("Should Not Let User Buy Subscription Of A Creator With Different Value", async function () {
        console.log(
          `Ether : ${parseEther("20.000000000000000001")}\nETH : ${parseEther(
            "19.999999999999999999",
          )}`,
        );
        await expect(
          contract
            .connect(thirdUser)
            .buyOrRenewSubscription(otherUser.address, 1, {
              value: parseEther("2"),
            }),
        ).to.be.revertedWith("Make sure To Send Same Amount The Creator Set");
        await expect(
          contract
            .connect(thirdUser)
            .buyOrRenewSubscription(otherUser.address, 1, {
              value: parseEther("19"),
            }),
        ).to.be.revertedWith("Make sure To Send Same Amount The Creator Set");
        await expect(
          contract
            .connect(thirdUser)
            .buyOrRenewSubscription(otherUser.address, 1, {
              value: parseEther("21"),
            }),
        ).to.be.revertedWith("Make sure To Send Same Amount The Creator Set");
        await expect(
          contract
            .connect(thirdUser)
            .buyOrRenewSubscription(otherUser.address, 1, {
              value: parseEther("19.999999999999999999"),
            }),
        ).to.be.revertedWith("Make sure To Send Same Amount The Creator Set");
        await expect(
          contract
            .connect(thirdUser)
            .buyOrRenewSubscription(otherUser.address, 1, {
              value: parseEther("20.000000000000000001"),
            }),
        ).to.be.revertedWith("Make sure To Send Same Amount The Creator Set");
      });
      it("Should Not Let User Renew Subscription Again Before Expiry", async function () {
        await contract
          .connect(thirdUser)
          .buyOrRenewSubscription(otherUser.address, 1, {
            value: parseEther("20"),
          });
        await expect(
          contract
            .connect(thirdUser)
            .buyOrRenewSubscription(otherUser.address, 1, {
              value: parseEther("20"),
            }),
        ).to.be.revertedWith("Subscription Still Active");
      });
    });
    describe("Can Buy Subscription", async function () {
      it("Should Let User Buy Creator Subscription", async function () {
        let tx = await contract
          .connect(thirdUser)
          .buyOrRenewSubscription(otherUser.address, 1, {
            value: parseEther("20"),
          });
        await tx.wait();
        const time = await contract.currentTime();
        const expiry = await contract.subscriptionBoughtDuration(
          thirdUser.address,
          otherUser.address,
        );
        console.log(`Current Time : ${time}\nExpiry : ${expiry}`);
        await expect(tx)
          .to.emit(contract, "SubscriptionBought")
          .withArgs(
            thirdUser.address,
            otherUser.address,
            1,
            parseEther("20"),
            expiry,
          );
      });
      it("Check All Values Updated Successfully", async function () {
        let fee = await contract.feeCollected();
        console.log(`Fee Collected : ${formatEther(fee)}`);
        let tx = await contract
          .connect(thirdUser)
          .buyOrRenewSubscription(otherUser.address, 1, {
            value: parseEther("20"),
          });
        await tx.wait();
        let block = await ethers.provider.getBlock(tx.blockNumber);
        const creator = await contract.creatorProfile(otherUser.address);
        fee = await contract.feeCollected();
        console.log(`Fee Collected : ${formatEther(fee)}`);
        let amount = parseEther("20") - fee;
        console.log(`Amount : ${amount}`);
        const expiry = await contract.subscriptionBoughtDuration(
          thirdUser.address,
          otherUser.address,
        );
        let activePlan = await contract.activePlan(
          thirdUser.address,
          otherUser.address,
        );
        console.log(`active Plan : ${activePlan}`);
        expect(activePlan).to.equal(1n);
        expect(fee).equals(parseEther("0.4"));
        expect(BigInt(amount)).to.equal(creator.totalBalance);
        expect(creator.totalSubscribers).equals(1n);
        console.log(
          `Expiry : ${expiry}\nBlock Timestamp : ${
            block!.timestamp + 20 * 86400
          }`,
        );
        expect(expiry).equals(BigInt(block!.timestamp + 20 * 86400));
      });
      it("Should Check NFT Has Minted When User Buy Subscription", async function () {
        let tx = await contract
          .connect(thirdUser)
          .buyOrRenewSubscription(otherUser.address, 1, {
            value: parseEther("20"),
          });
        await tx.wait();
        const block = await ethers.provider.getBlock(tx.blockNumber);
        console.log(`Block Time : ${block!.timestamp + 20 * 86400}`);
        await expect(tx).to.emit(contract, "SubscriptionBought");
        const isValid = await contract.isValidSubscription(
          thirdUser.address,
          otherUser.address,
        );
        console.log(`Is Valid : ${isValid ? "Yes" : "No"}`);
        const subExpiry = await contract.subscriptionBoughtDuration(
          thirdUser.address,
          otherUser.address,
        );
        const expiry = await nft.getExpiry(
          thirdUser.address,
          otherUser.address,
        );
        console.log(`Expiry : ${expiry}`);
        expect(isValid).to.equal(true);
        expect(expiry).equals(subExpiry);
      });
    });
  });
  describe("Gift Subscription", function () {
    describe("Can-Not Gift Subscriptions", function () {
      it("Should Not Let User Gift To Invalid Address", async function () {
        await expect(
          contract
            .connect(thirdUser)
            .giftSubscription(owner.address, 1, ethers.ZeroAddress),
        ).to.be.revertedWithCustomError(contract, "InvalidAddress");
      });
      it("Should Not Let User Gift To Address Who Is Not Creator", async function () {
        await expect(
          contract
            .connect(otherUser)
            .giftSubscription(owner.address, 1, thirdUser.address),
        ).to.be.revertedWithCustomError(contract, "NotTheCreator");
      });
      it("Should Not Let User Gift Plan Of Creator Which Is Not Active Or Not Found", async function () {
        await contract.connect(otherUser).addPlan(2, parseEther("202"), 220);
        await contract.connect(otherUser).deactivatePlan(2);
        await expect(
          contract
            .connect(thirdUser)
            .giftSubscription(owner.address,2,otherUser.address),
        ).to.be.revertedWith("Plan Not Active");
        await expect(
          contract
            .connect(thirdUser)
            .giftSubscription(owner.address,20,otherUser.address),
        ).to.be.revertedWith("Plan Not Active");
      });
    });
  });
});
