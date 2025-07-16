require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying FortuneRoulette with account:", deployer.address);

  // Substitua pelo endereço real do contrato Oracle já implantado
  const oracleAddress = "0x50889c6AcC530376E44c0f6518715B7b895f6459";

  const Roulette = await ethers.getContractFactory("FortuneRoulette");
  const roulette = await Roulette.deploy(
    339647,
    "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    "0x121477b2d9e75d847e756c0a8188e29ca1d5653eb3bd1dfc4d6c2cd5b3b1b4f2"
  );

  await roulette.waitForDeployment();

  console.log("FortuneRoulette deployed to:", await roulette.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
