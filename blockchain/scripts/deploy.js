// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
    // Obtenha as contas do Hardhat Network
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // --- Configuração do Chainlink VRF Mock ---
    // Deploy do VRFCoordinatorV2Mock
    const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    // Valores de exemplo para o mock (ajuste conforme necessário para as taxas reais)
    const BASE_FEE = ethers.parseEther("0.25"); // Taxa base da solicitação (exemplo)
    const GAS_PRICE_LINK = 1e9; // 1 Gwei (exemplo)
    const vrfCoordinatorMock = await VRFCoordinatorV2Mock.deploy(BASE_FEE, GAS_PRICE_LINK);
    await vrfCoordinatorMock.waitForDeployment();
    console.log("VRFCoordinatorV2Mock deployed to:", await vrfCoordinatorMock.getAddress());

    // Criar uma Subscription (assinatura) no mock
    const createSubscriptionTx = await vrfCoordinatorMock.createSubscription();
    const createSubscriptionReceipt = await createSubscriptionTx.wait();
    // O ID da assinatura pode ser encontrado nos logs
    const subscriptionId = createSubscriptionReceipt.logs[0].args.subId; // Ajuste se a estrutura do log for diferente
    console.log("Subscription ID created:", subscriptionId.toString());

    // Financie a Subscription no mock (com LINK/ETH de teste)
    // O valor deve ser suficiente para as taxas de gás das requisições VRF
    const fundAmount = ethers.parseEther("10"); // 10 ETH/LINK de teste
    await vrfCoordinatorMock.fundSubscription(subscriptionId, fundAmount);
    console.log(`Subscription ${subscriptionId} funded with ${ethers.formatEther(fundAmount)} ETH/LINK.`);

    // KeyHash (do Chainlink VRF - precisa ser um válido para o mock)
    // Você pode pegar um dos keyHashes padrão do Chainlink ou um que seu mock aceita.
    // Para testes, o mock pode não validar o keyHash, mas é bom usar um real.
    // Exemplo: 0x47402dc428cde0d5d71c0f068364233633663a45c361952a16bb5a54e99f018e
    // OU, para um valor arbitrário se o mock não for rigoroso:
    const keyHash = "0x47402dc428cde0d5d71c0f068364233633663a45c361952a16bb5a54e99f018e"; // Ou algum outro que você use

    // --- Deploy do seu Contrato CasinoRoletaVRF ---
    const CasinoRoletaVRF = await ethers.getContractFactory("CasinoRoletaVRF");
    const casinoContract = await CasinoRoletaVRF.deploy(
        subscriptionId,
        await vrfCoordinatorMock.getAddress(),
        keyHash
    );
    await casinoContract.waitForDeployment();
    console.log("CasinoRoletaVRF deployed to:", await casinoContract.getAddress());

    // Opcional: Adicione o contrato do cassino como um consumidor da sua Subscription
    await vrfCoordinatorMock.addConsumer(subscriptionId, await casinoContract.getAddress());
    console.log(`Casino contract added as consumer to Subscription ${subscriptionId}.`);

    // Retorne os endereços para uso posterior
    // ... (seu código anterior na função main) ...

    // Retorne os endereços e as instâncias dos contratos para uso posterior na Promise.then
    // ... (seu código anterior na função main) ...

    // Retorne os endereços e as instâncias dos contratos para uso posterior na Promise.then
    return {
        casinoContractInstance: casinoContract,
        casinoContractAddress: await casinoContract.getAddress(),
        vrfCoordinatorMockInstance: vrfCoordinatorMock, // <--- ADICIONE ISSO AQUI
        vrfCoordinatorMockAddress: await vrfCoordinatorMock.getAddress(),
        subscriptionId: subscriptionId.toString(),
        keyHash: keyHash
    };
}

main()
    // Capture a instância vrfCoordinatorMockInstance aqui
    .then(async ({ casinoContractInstance, casinoContractAddress, vrfCoordinatorMockInstance, vrfCoordinatorMockAddress, subscriptionId, keyHash }) => { // <--- AJUSTE AQUI
        console.log("\nDeployment complete!");
        console.log("CasinoRoletaVRF Address:", casinoContractAddress);
        console.log("VRFCoordinatorV2Mock Address:", vrfCoordinatorMockAddress);
        console.log("Chainlink VRF Subscription ID:", subscriptionId);
        console.log("Chainlink VRF KeyHash:", keyHash);

        // Salve esses endereços e o ABI para o frontend
        const fs = require('fs');
        const path = require('path');

        const contractsDir = path.join(__dirname, '..', 'frontend', 'src', 'contracts');
        if (!fs.existsSync(contractsDir)) {
            fs.mkdirSync(contractsDir, { recursive: true });
        }

        const contractData = {
            casinoRoletaVRF: {
                address: casinoContractAddress,
                abi: casinoContractInstance.interface.formatJson(),
            },
            vrfCoordinatorV2Mock: {
                address: vrfCoordinatorMockAddress,
                // Agora use vrfCoordinatorMockInstance para acessar a interface
                abi: vrfCoordinatorMockInstance.interface.formatJson(), // <--- AJUSTE AQUI
            },
            chainlinkConfig: {
                subscriptionId: subscriptionId,
                keyHash: keyHash
            }
        };
        fs.writeFileSync(
            path.join(contractsDir, 'contract-address.json'),
            JSON.stringify(contractData.casinoRoletaVRF.address, null, 2)
        );
        fs.writeFileSync(
            path.join(contractsDir, 'CasinoRoletaVRF.json'),
            JSON.stringify(contractData.casinoRoletaVRF, null, 2)
        );
        fs.writeFileSync(
            path.join(contractsDir, 'VRFCoordinatorV2Mock.json'),
            JSON.stringify(contractData.vrfCoordinatorV2Mock, null, 2)
        );
        fs.writeFileSync(
            path.join(contractsDir, 'chainlink-config.json'),
            JSON.stringify(contractData.chainlinkConfig, null, 2)
        );
        console.log("Contract addresses and ABIs saved to frontend/src/contracts/");

    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });