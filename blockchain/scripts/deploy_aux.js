// Importa o ethers do Hardhat, que nos dá as ferramentas para interagir com a blockchain.
const { network, ethers } = require("hardhat");

async function main() {
  console.log("Iniciando o processo de deploy...");

  // Pega a conta que está fazendo o deploy
  const [deployer] = await ethers.getSigners();
  console.log("Deploy sendo feito pela conta:", deployer.address);

  // Variáveis que serão preenchidas de acordo com a rede
  let vrfCoordinatorV2Address, subscriptionId, keyHash;

  // Verifica em qual rede estamos fazendo o deploy
  if (network.name === "hardhat") {
    // --- LÓGICA PARA DEPLOY LOCAL (REDE HARDHAT) ---
    console.log("Rede local detectada. Deploying Mocks...");
    
    // 1. Faz o deploy do nosso Mock do VRF Coordinator
    const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    const vrfCoordinatorV2Mock = await VRFCoordinatorV2Mock.deploy(
      ethers.parseEther("0.1"), // baseFee
      ethers.parseEther("0.001") // gasPriceLink
    );
    await vrfCoordinatorV2Mock.waitForDeployment();
    vrfCoordinatorV2Address = await vrfCoordinatorV2Mock.getAddress();
    console.log("VRFCoordinatorV2Mock deployed em:", vrfCoordinatorV2Address);

    // 2. Cria uma subscrição no Mock
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    const receipt = await tx.wait();
    subscriptionId = receipt.logs[0].args[0]; // Pega o ID da subscrição do evento
    console.log("Subscription criada no Mock com ID:", subscriptionId.toString());

    // O keyHash para a rede local não importa, pode ser qualquer um
    keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";

  } else {
    // --- LÓGICA PARA DEPLOY EM REDE DE TESTE (EX: SEPOLIA) ---
    console.log(`Rede ${network.name} detectada. Usando endereços reais.`);

    // Endereços Reais da Chainlink para a rede Sepolia
    vrfCoordinatorV2Address = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
    keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";

    // !!! IMPORTANTE !!!
    // Você PRECISA substituir este valor pelo ID da sua subscrição criada no site vrf.chain.link
    subscriptionId = "SEU_ID_DA_SUBSCRICAO_AQUI"; 
    console.log("Usando Subscription ID:", subscriptionId);

    if (!subscriptionId || subscriptionId === "SEU_ID_DA_SUBSCRICAO_AQUI") {
        console.error("ERRO: Por favor, substitua 'SEU_ID_DA_SUBSCRICAO_AQUI' no script de deploy pelo seu ID de subscrição da Chainlink VRF.");
        return;
    }
  }

  // --- FAZ O DEPLOY DO CONTRATO PRINCIPAL ---
  console.log("Fazendo deploy do CasinoRoletaVRF...");

  const CasinoRoletaVRF = await ethers.getContractFactory("CasinoRoletaVRF");
  const casinoContract = await CasinoRoletaVRF.deploy(
    subscriptionId,
    vrfCoordinatorV2Address,
    keyHash
  );
  await casinoContract.waitForDeployment();
  const contractAddress = await casinoContract.getAddress();

  console.log("----------------------------------------------------");
  console.log("✅ Contrato CasinoRoletaVRF implantado com sucesso!");
  console.log("Endereço do Contrato:", contractAddress);
  console.log("----------------------------------------------------");

  // Se estivermos na rede local, precisamos adicionar o contrato como consumidor do Mock
  if (network.name === "hardhat") {
      const vrfCoordinatorV2Mock = await ethers.getContractAt("VRFCoordinatorV2Mock", vrfCoordinatorV2Address);
      await vrfCoordinatorV2Mock.addConsumer(subscriptionId, contractAddress);
      console.log("Contrato do Cassino adicionado como consumidor do Mock VRF.");
  }
}

// Padrão recomendado para executar o script de forma assíncrona
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});