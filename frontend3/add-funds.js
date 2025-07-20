const { ethers } = require("hardhat");

async function main() {
  // Endereço do contrato
  const CONTRACT_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  // Obter o contrato
  const CasinoRoletaVRF = await ethers.getContractFactory("CasinoRoletaVRF");
  const casino = CasinoRoletaVRF.attach(CONTRACT_ADDRESS);
  
  // Verificar saldo atual
  const stats = await casino.getCasinoStats();
  console.log("Saldo atual da casa:", ethers.utils.formatEther(stats.balance), "ETH");
  
  // Adicionar fundos
  const amount = ethers.utils.parseEther("1.0"); // 1 ETH
  console.log("Adicionando", ethers.utils.formatEther(amount), "ETH ao casino...");
  
  const tx = await casino.addHouseFunds({ value: amount });
  await tx.wait();
  
  console.log("✅ Fundos adicionados com sucesso!");
  
  // Verificar novo saldo
  const newStats = await casino.getCasinoStats();
  console.log("Novo saldo da casa:", ethers.utils.formatEther(newStats.balance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 