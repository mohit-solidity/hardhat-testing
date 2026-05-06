import { expect } from "chai";
import { parseEther } from "ethers";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Buy Sell Subscription Logic", function () {
  let owner: any;
  let otherUser: any;
  let thirdUser: any;
  let contract: any;
  beforeEach(async function(){
    [owner,otherUser,,thirdUser] = await ethers.getSigners();
    contract = await ethers.deployContract("Subscription");
    contract.addCreator(otherUser.address);
  })
  describe("Buy Subscription",function(){
    it("Should Not Let Any User Buy Subscription For Invalid Address",async function () {
        
    })
  });
  describe("Gift Subscription",function(){

  })
});
