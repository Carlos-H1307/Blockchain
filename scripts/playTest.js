require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x4d040f7166a4a5727ab4bba5b406b5662049baf4"; // CONTRATO NOVO
  const CoinFlip = await ethers.getContractAt("CoinFlip", contractAddress);
  const [player] = await ethers.getSigners();

  console.log("Apostando com:", player.address);

  const tx = await CoinFlip.flip(true, {
    uint256 public betAmount = 10000000000000000; // 0.01 ETH
  });

  console.log("Transação enviada. Aguardando confirmação...");
  await tx.wait();

  console.log("Aposta enviada! Aguarde o VRF responder.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
