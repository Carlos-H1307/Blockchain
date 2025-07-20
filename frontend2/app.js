// --- CONFIGURAÇÕES DO CONTRATO ---
// Substitua pelo endereço do seu contrato implantado
const CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere"; 

// Substitua pela ABI do seu contrato (copie do arquivo .json gerado após a compilação)
const CONTRACT_ABI = [
    // Cole a ABI completa do seu contrato CasinoRoletaVRF aqui
    // Exemplo de uma parte da ABI (COMPLETA É MUITO MAIOR!):
    {
        "inputs": [
            { "internalType": "uint64", "name": "subscriptionId", "type": "uint64" },
            { "internalType": "address", "name": "vrfCoordinator", "type": "address" },
            { "internalType": "bytes32", "name": "keyHash_", "type": "bytes32" }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "indexed": false, "internalType": "bool", "name": "won", "type": "bool" },
            { "indexed": false, "internalType": "uint256", "name": "rouletteResult", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "requestId", "type": "uint256" }
        ],
        "name": "GameResult",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": false, "internalType": "uint256", "name": "newBalance", "type": "uint256" }
        ],
        "name": "HouseBalanceUpdated",
        "type": "event"
    },
    // ... adicione o restante da ABI aqui ...
    {
        "inputs": [],
        "name": "houseBalance",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MIN_BET",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "MAX_BET",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "paused",
        "outputs": [
            { "internalType": "bool", "name": "", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "requestId", "type": "uint256" }
        ],
        "name": "pendingBets",
        "outputs": [
            { "internalType": "address", "name": "player", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "internalType": "bool", "name": "active", "type": "bool" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "name": "playerLosses",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "name": "playerTotalBet",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "name": "playerTotalWon",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "name": "playerWins",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pendingBetsCount",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalBetsPlaced",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalPayouts",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // Funções do contrato
    {
        "inputs": [],
        "name": "addHouseFunds",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "withdrawHouseFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "placeBet",
        "outputs": [
            { "internalType": "uint256", "name": "requestId", "type": "uint256" }
        ],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "player", "type": "address" }
        ],
        "name": "getPlayerStats",
        "outputs": [
            { "internalType": "uint256", "name": "wins", "type": "uint256" },
            { "internalType": "uint256", "name": "losses", "type": "uint256" },
            { "internalType": "uint256", "name": "totalGames", "type": "uint256" },
            { "internalType": "uint256", "name": "totalBetAmount", "type": "uint256" },
            { "internalType": "uint256", "name": "totalWonAmount", "type": "uint256" },
            { "internalType": "uint256", "name": "netResult", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getCasinoStats",
        "outputs": [
            { "internalType": "uint256", "name": "balance", "type": "uint256" },
            { "internalType": "uint256", "name": "totalBets", "type": "uint256" },
            { "internalType": "uint256", "name": "totalPayoutsAmount", "type": "uint256" },
            { "internalType": "uint256", "name": "contractBalance", "type": "uint256" },
            { "internalType": "uint256", "name": "pendingBets", "type": "uint256" },
            { "internalType": "bool", "name": "isPaused", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "requestId", "type": "uint256" }
        ],
        "name": "getBetInfo",
        "outputs": [
            { "internalType": "address", "name": "player", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "internalType": "bool", "name": "active", "type": "bool" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "unpause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "newKeyHash", "type": "bytes32" },
            { "internalType": "uint32", "name": "newCallbackGasLimit", "type": "uint32" },
            { "internalType": "uint16", "name": "newRequestConfirmations", "type": "uint16" }
        ],
        "name": "updateVRFConfig",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint64", "name": "newSubscriptionId", "type": "uint64" }
        ],
        "name": "updateSubscriptionId",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getVRFConfig",
        "outputs": [
            { "internalType": "uint64", "name": "subscriptionId", "type": "uint64" },
            { "internalType": "bytes32", "name": "keyHashValue", "type": "bytes32" },
            { "internalType": "uint32", "name": "gasLimit", "type": "uint32" },
            { "internalType": "uint16", "name": "confirmations", "type": "uint16" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    { "stateMutability": "payable", "type": "receive" },
    { "stateMutability": "payable", "type": "fallback" }
];


let provider;
let signer;
let contract;
let currentAccount = null;
let contractOwner = null; // Para armazenar o dono do contrato e controlar a visibilidade de botões

// Elementos da UI
const accountAddressSpan = document.getElementById("account-address");
const contractAddressSpan = document.getElementById("contract-address");
const houseBalanceSpan = document.getElementById("house-balance");
const contractEthBalanceSpan = document.getElementById("contract-eth-balance");
const contractPausedSpan = document.getElementById("contract-paused");
const pendingBetsCountSpan = document.getElementById("pending-bets-count");
const minBetSpan = document.getElementById("min-bet");
const maxBetSpan = document.getElementById("max-bet");
const betAmountInput = document.getElementById("bet-amount");
const placeBetBtn = document.getElementById("place-bet-btn");
const betMessage = document.getElementById("bet-message");
const lastBetPlayerSpan = document.getElementById("last-bet-player");
const lastBetAmountSpan = document.getElementById("last-bet-amount");
const lastRouletteResultSpan = document.getElementById("last-roulette-result");
const lastWonStatusSpan = document.getElementById("last-won-status");
const lastPayoutSpan = document.getElementById("last-payout");
const myWinsSpan = document.getElementById("my-wins");
const myLossesSpan = document.getElementById("my-losses");
const myTotalBetSpan = document.getElementById("my-total-bet");
const myTotalWonSpan = document.getElementById("my-total-won");
const myNetResultSpan = document.getElementById("my-net-result");
const ownerSection = document.querySelector(".owner-section");
const addHouseFundsBtn = document.getElementById("add-house-funds-btn");
const withdrawHouseFundsBtn = document.getElementById("withdraw-house-funds-btn");
const pauseBtn = document.getElementById("pause-btn");
const unpauseBtn = document.getElementById("unpause-btn");
const ownerMessage = document.getElementById("owner-message");

// --- FUNÇÕES DE INICIALIZAÇÃO E CONEXÃO ---

async function init() {
    contractAddressSpan.textContent = CONTRACT_ADDRESS;

    if (typeof window.ethereum !== "undefined") {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Solicita acesso à conta
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            currentAccount = accounts[0];
            accountAddressSpan.textContent = currentAccount;
            signer = provider.getSigner();
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            
            // Ouvir mudanças de conta
            window.ethereum.on("accountsChanged", handleAccountsChanged);
            // Ouvir mudanças de rede
            window.ethereum.on("chainChanged", handleChainChanged);

            await updateUI();
            listenToContractEvents();
            checkOwner(); // Verifica se a conta atual é o dono
            
        } catch (error) {
            console.error("Erro ao conectar ao MetaMask:", error);
            accountAddressSpan.textContent = "Erro ao conectar. Por favor, conecte sua carteira.";
            document.getElementById("wallet-status").classList.add("error");
        }
    } else {
        accountAddressSpan.textContent = "MetaMask não detectado. Por favor, instale-o.";
        document.getElementById("wallet-status").classList.add("error");
    }
}

async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        console.log("Por favor, conecte ao MetaMask.");
        accountAddressSpan.textContent = "Desconectado.";
        currentAccount = null;
        ownerSection.style.display = "none"; // Esconde a seção do proprietário
    } else {
        currentAccount = accounts[0];
        accountAddressSpan.textContent = currentAccount;
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer); // Re-instancia com o novo signer
        await updateUI();
        checkOwner(); // Re-verifica o dono
    }
}

function handleChainChanged(chainId) {
    console.log("Rede alterada para:", chainId);
    window.location.reload(); // Recarrega a página para garantir que o provider e o signer estejam corretos
}

// --- FUNÇÕES DE ATUALIZAÇÃO DA UI ---

async function updateUI() {
    if (!contract) return;

    try {
        const casinoStats = await contract.getCasinoStats();
        houseBalanceSpan.textContent = ethers.utils.formatEther(casinoStats.balance);
        contractEthBalanceSpan.textContent = ethers.utils.formatEther(casinoStats.contractBalance);
        contractPausedSpan.textContent = casinoStats.isPaused ? "Sim" : "Não";
        pendingBetsCountSpan.textContent = casinoStats.pendingBets.toString();

        const minBet = await contract.MIN_BET();
        const maxBet = await contract.MAX_BET();
        minBetSpan.textContent = ethers.utils.formatEther(minBet);
        maxBetSpan.textContent = ethers.utils.formatEther(maxBet);
        betAmountInput.min = ethers.utils.formatEther(minBet);
        betAmountInput.max = ethers.utils.formatEther(maxBet);

        if (currentAccount) {
            await updatePlayerStats(currentAccount);
        }

    } catch (error) {
        console.error("Erro ao carregar informações do contrato:", error);
        alert("Erro ao carregar informações do contrato. Verifique a console para detalhes.");
    }
}

async function updatePlayerStats(playerAddress) {
    if (!contract) return;
    try {
        const stats = await contract.getPlayerStats(playerAddress);
        myWinsSpan.textContent = stats.wins.toString();
        myLossesSpan.textContent = stats.losses.toString();
        myTotalBetSpan.textContent = ethers.utils.formatEther(stats.totalBetAmount);
        myTotalWonSpan.textContent = ethers.utils.formatEther(stats.totalWonAmount);
        
        const netResultValue = ethers.utils.formatEther(stats.netResult);
        myNetResultSpan.textContent = netResultValue;
        if (stats.totalWonAmount.gte(stats.totalBetAmount)) {
            myNetResultSpan.style.color = "green";
        } else {
            myNetResultSpan.style.color = "red";
        }

    } catch (error) {
        console.error("Erro ao carregar estatísticas do jogador:", error);
    }
}

async function checkOwner() {
    if (!contract) return;
    try {
        contractOwner = await contract.owner();
        if (currentAccount && currentAccount.toLowerCase() === contractOwner.toLowerCase()) {
            ownerSection.style.display = "block"; // Mostra a seção se for o dono
        } else {
            ownerSection.style.display = "none"; // Esconde se não for
        }
    } catch (error) {
        console.error("Erro ao verificar o dono do contrato:", error);
        ownerSection.style.display = "none";
    }
}

// --- FUNÇÕES DE INTERAÇÃO COM O CONTRATO ---

placeBetBtn.addEventListener("click", async () => {
    if (!contract || !currentAccount) {
        betMessage.textContent = "Por favor, conecte sua carteira primeiro.";
        betMessage.classList.add("error");
        return;
    }

    const betAmount = betAmountInput.value;
    if (isNaN(betAmount) || parseFloat(betAmount) <= 0) {
        betMessage.textContent = "Por favor, insira um valor de aposta válido.";
        betMessage.classList.add("error");
        return;
    }

    try {
        betMessage.textContent = "Aguardando confirmação da transação...";
        betMessage.classList.remove("error", "success");

        const tx = await contract.placeBet({
            value: ethers.utils.parseEther(betAmount)
        });
        await tx.wait(); // Espera a transação ser minerada

        betMessage.textContent = `Aposta de ${betAmount} ETH feita com sucesso! Aguardando resultado da roleta...`;
        betMessage.classList.add("success");
        await updateUI(); // Atualiza UI após a aposta
        
    } catch (error) {
        console.error("Erro ao fazer a aposta:", error);
        if (error.code === 4001) {
            betMessage.textContent = "Transação rejeitada pelo usuário.";
        } else if (error.message.includes("Contrato pausado")) {
            betMessage.textContent = "Aposta falhou: Contrato pausado pelo proprietário.";
        } else if (error.message.includes("Aposta muito baixa")) {
            betMessage.textContent = "Aposta falhou: Valor muito baixo. Verifique MIN_BET.";
        } else if (error.message.includes("Aposta muito alta")) {
            betMessage.textContent = "Aposta falhou: Valor muito alto. Verifique MAX_BET.";
        } else if (error.message.includes("Casino nao tem fundos suficientes")) {
            betMessage.textContent = "Aposta falhou: O cassino não tem fundos suficientes para cobrir o potencial pagamento.";
        } else {
            betMessage.textContent = `Erro ao fazer aposta: ${error.message || error.code}`;
        }
        betMessage.classList.add("error");
    }
});

// --- FUNÇÕES DO PROPRIETÁRIO ---

addHouseFundsBtn.addEventListener("click", async () => {
    if (!contract || !currentAccount || currentAccount.toLowerCase() !== contractOwner.toLowerCase()) {
        ownerMessage.textContent = "Apenas o proprietário pode adicionar fundos.";
        ownerMessage.classList.add("error");
        return;
    }
    try {
        ownerMessage.textContent = "Adicionando fundos da casa (0.1 ETH)...";
        ownerMessage.classList.remove("error", "success");
        const tx = await contract.addHouseFunds({ value: ethers.utils.parseEther("0.1") });
        await tx.wait();
        ownerMessage.textContent = "Fundos adicionados com sucesso!";
        ownerMessage.classList.add("success");
        await updateUI();
    } catch (error) {
        console.error("Erro ao adicionar fundos da casa:", error);
        ownerMessage.textContent = `Erro: ${error.message || error.code}`;
        ownerMessage.classList.add("error");
    }
});

withdrawHouseFundsBtn.addEventListener("click", async () => {
    if (!contract || !currentAccount || currentAccount.toLowerCase() !== contractOwner.toLowerCase()) {
        ownerMessage.textContent = "Apenas o proprietário pode sacar fundos.";
        ownerMessage.classList.add("error");
        return;
    }
    const amountToWithdraw = ethers.utils.parseEther("0.05"); // Exemplo de valor
    try {
        ownerMessage.textContent = "Sacando fundos da casa (0.05 ETH)...";
        ownerMessage.classList.remove("error", "success");
        const tx = await contract.withdrawHouseFunds(amountToWithdraw);
        await tx.wait();
        ownerMessage.textContent = "Fundos sacados com sucesso!";
        ownerMessage.classList.add("success");
        await updateUI();
    } catch (error) {
        console.error("Erro ao sacar fundos da casa:", error);
        ownerMessage.textContent = `Erro: ${error.message || error.code}`;
        ownerMessage.classList.add("error");
    }
});

pauseBtn.addEventListener("click", async () => {
    if (!contract || !currentAccount || currentAccount.toLowerCase() !== contractOwner.toLowerCase()) {
        ownerMessage.textContent = "Apenas o proprietário pode pausar.";
        ownerMessage.classList.add("error");
        return;
    }
    try {
        ownerMessage.textContent = "Pausando contrato...";
        ownerMessage.classList.remove("error", "success");
        const tx = await contract.pause();
        await tx.wait();
        ownerMessage.textContent = "Contrato pausado com sucesso!";
        ownerMessage.classList.add("success");
        await updateUI();
    } catch (error) {
        console.error("Erro ao pausar contrato:", error);
        ownerMessage.textContent = `Erro: ${error.message || error.code}`;
        ownerMessage.classList.add("error");
    }
});

unpauseBtn.addEventListener("click", async () => {
    if (!contract || !currentAccount || currentAccount.toLowerCase() !== contractOwner.toLowerCase()) {
        ownerMessage.textContent = "Apenas o proprietário pode despausar.";
        ownerMessage.classList.add("error");
        return;
    }
    try {
        ownerMessage.textContent = "Despausando contrato...";
        ownerMessage.classList.remove("error", "success");
        const tx = await contract.unpause();
        await tx.wait();
        ownerMessage.textContent = "Contrato despausado com sucesso!";
        ownerMessage.classList.add("success");
        await updateUI();
    } catch (error) {
        console.error("Erro ao despausar contrato:", error);
        ownerMessage.textContent = `Erro: ${error.message || error.code}`;
        ownerMessage.classList.add("error");
    }
});


// --- OUVIR EVENTOS DO CONTRATO ---

function listenToContractEvents() {
    if (!contract) return;

    // Evento GameResult
    contract.on("GameResult", (player, amount, won, rouletteResult, payout, requestId) => {
        console.log("GameResult Evento:", { player, amount, won, rouletteResult, payout, requestId });
        
        // Se o resultado for para o jogador atual
        if (player.toLowerCase() === currentAccount.toLowerCase()) {
            lastBetPlayerSpan.textContent = player.substring(0, 6) + "...";
            lastBetAmountSpan.textContent = ethers.utils.formatEther(amount);
            lastRouletteResultSpan.textContent = rouletteResult.toString();
            lastWonStatusSpan.textContent = won ? "SIM (Verde!)" : "NÃO (Vermelho!)";
            lastWonStatusSpan.style.color = won ? "green" : "red";
            lastPayoutSpan.textContent = ethers.utils.formatEther(payout);
            
            // Força atualização das estatísticas do jogador
            updatePlayerStats(currentAccount);
            // Atualiza o saldo da casa
            updateUI();
        }
    });

    // Evento HouseBalanceUpdated
    contract.on("HouseBalanceUpdated", (newBalance) => {
        console.log("HouseBalanceUpdated Evento:", ethers.utils.formatEther(newBalance), "ETH");
        houseBalanceSpan.textContent = ethers.utils.formatEther(newBalance);
    });

    // Você pode adicionar ouvintes para outros eventos como BetPlaced, VRFRequested
}


// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", init);