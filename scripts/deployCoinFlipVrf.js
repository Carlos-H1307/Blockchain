// scripts/deploy-coinflip.js

const { ethers, run, network } = require("hardhat");

// --- CONFIGURAÇÕES DO DEPLOY ---
// Preencha com os dados da sua subscrição VRF
const VRF_SUBSCRIPTION_ID = "778182"; 

// Dados do Coordenador VRF para a rede Sepolia (verificar sempre na doc da Chainlink)
const VRF_COORDINATOR_ADDRESS = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
// -----------------------------

async function main() {
  console.log("Iniciando o deploy do contrato CoinFlip...");

  // Argumentos do construtor
  const constructorArgs = [
    VRF_COORDINATOR_ADDRESS,
    VRF_SUBSCRIPTION_ID,
    KEY_HASH
  ];

  // Obtém a "fábrica" do contrato
  const coinFlipFactory = await ethers.getContractFactory("CoinFlip");

  console.log("Fazendo o deploy... Por favor, aguarde.");

  // Faz o deploy
  const coinFlip = await coinFlipFactory.deploy(...constructorArgs);

  // Espera a confirmação do deploy na blockchain
  await coinFlip.waitForDeployment();
  const contractAddress = await coinFlip.getAddress();
  
  console.log(`✅ Contrato "CoinFlip" implantado com sucesso no endereço: ${contractAddress}`);

  // Verifica o contrato no Etherscan se não estivermos em uma rede local
  if (network.config.chainId !== 31337 && process.env.ETHERSCAN_API_KEY) {
    console.log("Aguardando confirmações de bloco para verificação...");
    // Hardhat recomenda esperar alguns blocos antes de verificar
    await new Promise(resolve => setTimeout(resolve, 60000)); // Espera 60 segundos

    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: constructorArgs,
      });
      console.log("✅ Contrato verificado no Etherscan!");
    } catch (e) {
      if (e.message.toLowerCase().includes("already verified")) {
        console.log("Contrato já verificado no Etherscan.");
      } else {
        console.error("Falha ao verificar o contrato:", e);
      }
    }
  }
}

// Padrão recomendado para usar async/await em todos os lugares
// e tratar erros corretamente.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});