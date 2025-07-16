const { ethers } = require("hardhat");

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
  const block = await provider.getBlockNumber();
  console.log("Conectado à Sepolia. Bloco mais recente:", block);
}

main().catch(console.error);
