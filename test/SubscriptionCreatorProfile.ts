import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Creator Profile Setup", function () {
  let owner: any;
  let otherUser: any;
  let thirdUser: any;
  let contract: any;
  beforeEach(async function () {
    [owner, otherUser, thirdUser] = await ethers.getSigners();
    contract = await ethers.deployContract("Subscription");
  });
  describe("Creator Only", function () {
    it("Should Only Creator Can Set His Profile", async function () {
      await contract.addCreator(otherUser.address);
      await contract.connect(otherUser).setCreatorName("Pirate");
      const isValidUsername = await contract.isValidUserName("Pirate");
      const creator = await contract.creatorProfile(otherUser.address);
      expect(creator.name).equals("Pirate");
      expect(isValidUsername).to.equals(true);
    });
  });
  it("Should Not Let Creator Has Null Name",async function(){
    await expect(contract.setCreatorName("")).to.be.revertedWith("UserName Length Can't Be Null")
  })
  it("Should Not Let Two Creators Has Same Username", async function () {
    await contract.setCreatorName("Pirate");
    await contract.addCreator(otherUser.address);
    await expect(
      contract.connect(otherUser).setCreatorName("Pirate"),
    ).to.be.revertedWith("UserName Already Occupied");
  });
  it("Should Let A Creator Change His Username And Another Creator To Reclaim Previous Owner's Name", async function () {
    await contract.setCreatorName("Pirate");
    let creator = await contract.creatorProfile(owner.address);
    expect(creator.name).equals("Pirate");
    console.log(`Creator Name (Owner) : ${creator.name}`)
    await contract.setCreatorName("Mohit");
    creator = await contract.creatorProfile(owner.address);
    expect(creator.name).equals("Mohit");
    console.log(`Creator Name New (Owner) : ${creator.name}`)
    await contract.addCreator(otherUser.address);
    await contract.connect(otherUser).setCreatorName("Pirate");
    creator = await contract.creatorProfile(otherUser.address);
    expect(creator.name).equals("Pirate");
    console.log(`Creator Name (Another User) : ${creator.name}`)
  });
  describe("Not Creator", function () {});
});
