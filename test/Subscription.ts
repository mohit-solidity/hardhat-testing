import { expect } from "chai";
import { parseEther } from "ethers";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Subscription", function () {
  let owner: any;
  let otherUser: any;
  let contract: any;
  before(async function () {
    [owner, otherUser] = await ethers.getSigners();
    contract = await ethers.deployContract("Subscription");
    await contract.addCreator(otherUser.address);
  });
  it("Only Owner Can Call The Function pause Contract", async function () {
    await expect(contract.pauseContract()).to.be.emit(
      contract,
      "ContractPaused",
    );
  });
  it("Owner Can-not Pause Again After Pausing", async function () {
    await expect(contract.pauseContract()).to.be.revertedWith("Already Paused");
  });
  it("Only Owner Can Call The Function Resume Contract After It Paused", async function () {
    await expect(contract.resumeContract()).to.be.emit(
      contract,
      "ContractResumed",
    );
  });
  it("Should Not Let Another User Pause Contract", async function () {
    await expect(
      contract.connect(otherUser).pauseContract(),
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });
  it("Should Not Let Another User Resume Contract", async function () {
    await expect(
      contract.connect(otherUser).resumeContract(),
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });
  it("Only Owner Can Change The Fee", async function () {
    await expect(
      contract.connect(otherUser).changeFee(20),
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    await contract.changeFee(700);
    expect(await contract.feeAPY()).to.equal(700n);
  });
  it("Owner Can Change Max Fee To 10%",async function(){
    await contract.changeFee(1000);
    let fee = await contract.feeAPY();
    console.log(`Fee : ${fee}`)
    expect(fee).to.equal(1000n);
  });
  it("Owner Can't Change Fee Greater Than 10%(1000)",async function(){
    await expect(contract.changeFee(1001)).to.be.revertedWith("Max Fee Is 10% And Minimum Is 1%");
  });
  it("Owner Can't Change Fee Less Than 1%(100)",async function(){
    await expect(contract.changeFee(0)).to.be.revertedWith("Max Fee Is 10% And Minimum Is 1%");
  });
  it("Owner Can Change Min Fee To 1%",async function(){
    await contract.changeFee(100);
    let fee = await contract.feeAPY();
    console.log(`Fee : ${fee}`)
    expect(fee).to.equal(100n);
  });
  it("Should Not Let Owner To Add Same Creator Again", async function () {
    await expect(contract.addCreator(otherUser.address)).to.be.revertedWith(
      "Already The Creator",
    );
  });
  it("Should Not Let Owner Add Invalid Address",async function(){
    await expect(contract.addCreator(ethers.ZeroAddress)).to.be.revertedWith("Invalid Address");
  })
  it("Should not let any other user to add any creator", async function () {
    await expect(
      contract.connect(otherUser).addCreator(owner.address),
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });
});
