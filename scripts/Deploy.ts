import hre from "hardhat";
async function main() {
  const Counter = await hre.ethers.getContractFactory("TimeStaking");
  const counter = await Counter.deploy();
  await counter.waitForDeployment();
  console.log(`Deployed To ${counter.target}`);
}
main().catch((error) => {
  console.log(`Error : ${error}`);
  process.exitCode = 1;
});
