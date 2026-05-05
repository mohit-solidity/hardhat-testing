import { expect } from "chai";
import { parseEther } from "ethers";
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
  it("Should Not Let Creator Has Null Name", async function () {
    await expect(contract.setCreatorName("")).to.be.revertedWith(
      "UserName Length Can't Be Null",
    );
  });
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
    console.log(`Creator Name (Owner) : ${creator.name}`);
    await contract.setCreatorName("Mohit");
    creator = await contract.creatorProfile(owner.address);
    expect(creator.name).equals("Mohit");
    console.log(`Creator Name New (Owner) : ${creator.name}`);
    await contract.addCreator(otherUser.address);
    await contract.connect(otherUser).setCreatorName("Pirate");
    creator = await contract.creatorProfile(otherUser.address);
    expect(creator.name).equals("Pirate");
    console.log(`Creator Name (Another User) : ${creator.name}`);
  });
  describe("Creator Add Plans",function(){
    it("Should Let Creator Add Plan For Valid Range",async function(){
        await contract.addCreator(otherUser.address);
        await expect(contract.connect(otherUser).addPlan(1,parseEther("20"),30)).to.emit(contract,"PlanAdded").withArgs(otherUser.address,1);
        const data = await contract.creatorPlans(otherUser.address,1);
        console.log(`Price : ${data.price}\nDuration : ${data.duration}\nIs Active : ${data.isactive?"Yes":"No"}`)
        expect(data.price).equals(parseEther("20"));
        expect(data.duration).equals(30);
        expect(data.isActive).equals(true);
    });
    it("Should Let Creator Add Plans At Limits",async function(){
        await contract.addCreator(otherUser.address);
        await expect(contract.connect(otherUser).addPlan(1,parseEther("20"),1)).to.emit(contract,"PlanAdded").withArgs(otherUser.address,1);
        await expect(contract.connect(otherUser).addPlan(2,parseEther("20"),365)).to.emit(contract,"PlanAdded").withArgs(otherUser.address,2);
    });
    it("Checks All Errors ",async function(){
        await contract.addCreator(otherUser.address);
        const otheruser = await contract.connect(otherUser);
        await expect(otheruser.addPlan(1,parseEther("0"),1)).to.be.revertedWith("Invalid Price");
        await expect(otheruser.addPlan(1,parseEther("20"),366)).to.be.revertedWith("Invalid Duration");
        await expect(otheruser.addPlan(1,parseEther("20"),1)).to.emit(contract,"PlanAdded").withArgs(otherUser.address,1);
        await expect(otheruser.addPlan(1,parseEther("20"),30)).to.be.revertedWith("Plan Already exists");
        await expect(otheruser.addPlan(1,parseEther("20"),0)).to.be.revertedWith("Invalid Duration");
    });
  })
  describe("Plan Activate/Deactivate Edge Cases",function(){
    it.only("Should Let Owner Deactivate A Plan",async function(){
        await contract.addCreator(otherUser.address);
        const otheruser = await contract.connect(otherUser);
        await expect(otheruser.addPlan(1,parseEther("20"),30)).to.emit(contract,"PlanAdded").withArgs(otherUser.address,1);
        await expect(otheruser.deactivatePlan(1)).to.emit(contract,"PlanDeactivated").withArgs(otherUser.address,1);
        await expect(otheruser.deactivatePlan(1)).to.be.revertedWith("Plan Already Deactivated");
        await expect(otheruser.deactivatePlan(20)).to.be.revertedWith("Plan not found");
    });
    it.only("Should Let Owner Activate Plan Again",async function(){
        await contract.addCreator(otherUser.address);
        const otheruser = await contract.connect(otherUser);
        await expect(otheruser.addPlan(1,parseEther("20"),30)).to.emit(contract,"PlanAdded").withArgs(otherUser.address,1);
        await expect(otheruser.deactivatePlan(1)).to.emit(contract,"PlanDeactivated").withArgs(otherUser.address,1);
        await expect(otheruser.activatePlan(1)).to.emit(contract,"PlanActivated").withArgs(otherUser.address,1);
        await expect(otheruser.activatePlan(1)).to.be.revertedWith("Plan Already Active");
        await expect(otheruser.activatePlan(10)).to.be.revertedWith("Plan not found");
    })
  })
  describe("Not Creator", function () {});
});
