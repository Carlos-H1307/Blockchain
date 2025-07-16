require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const oldContractAddress = "0x4D040F7166A4A5727AB4bba5B406b5662049BAf4";

  console.log("Conectando ao contrato antigo:", oldContractAddress);

  const CoinFlip = await ethers.getContractAt("CoinFlip", oldContractAddress);

  const [deployer] = await ethers.getSigners();
  console.log("Usando conta:", deployer.address);

  const balance = await ethers.provider.getBalance(oldContractAddress);
  console.log("Saldo atual do contrato:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.log("⚠️ O contrato não tem saldo para sacar.");
    return;
  }

  const tx = await CoinFlip.withdraw();
  console.log("⏳ Enviando transação para withdraw...");

  await tx.wait();

  console.log("✅ Saque realizado com sucesso!");
}

main().catch((error) => {
  console.error("Erro ao executar saque:", error);
  process.exitCode = 1;
});
