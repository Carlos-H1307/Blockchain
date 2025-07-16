require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const vrfCoordinator = process.env.VRF_COORDINATOR;
  const keyHash = process.env.VRF_KEY_HASH;
  const subscriptionId = process.env.VRF_SUBSCRIPTION_ID;

  const CoinFlip = await ethers.getContractFactory("CoinFlip");
  const coinFlip = await CoinFlip.deploy(vrfCoordinator, keyHash, subscriptionId);

  await coinFlip.waitForDeployment();
  console.log("CoinFlip deployed to:", await coinFlip.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
