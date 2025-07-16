require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x4d040f7166a4a5727ab4bba5b406b5662049baf4";
  const CoinFlip = await ethers.getContractAt("CoinFlip", contractAddress);

  const tx = await CoinFlip.fundContract({ value: ethers.parseEther("0.05") });
  await tx.wait();

  console.log("Contrato financiado com sucesso.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
