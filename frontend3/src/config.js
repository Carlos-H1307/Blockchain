// Configurações do contrato
export const CONTRACT_CONFIG = {
  // Endereço do contrato - SUBSTITUA PELO ENDEREÇO REAL DO SEU CONTRATO
  ADDRESS: "0x9E545E3C0baAB3E08CdfD552C960A1050f373042",
  
  // ABI completo do contrato
  ABI: [
    "function placeBet() external payable",
    "function houseBalance() external view returns (uint256)",
    "function MIN_BET() external view returns (uint256)",
    "function MAX_BET() external view returns (uint256)",
    "function paused() external view returns (bool)",
    "function getPlayerStats(address player) external view returns (uint256 wins, uint256 losses, uint256 totalGames, uint256 totalBetAmount, uint256 totalWonAmount, uint256 netResult)",
    "function getCasinoStats() external view returns (uint256 balance, uint256 totalBets, uint256 totalPayoutsAmount, uint256 contractBalance, uint256 pendingBets, bool isPaused)",
    "function getBetInfo(uint256 requestId) external view returns (address player, uint256 amount, bool active, uint256 timestamp)",
    "function addHouseFunds() external payable",
    "function withdrawHouseFunds(uint256 amount) external",
    "function pause() external",
    "function unpause() external",
    "function resolveStuckBet(uint256 requestId) external",
    "function updateVRFConfig(bytes32 newKeyHash, uint32 newCallbackGasLimit, uint16 newRequestConfirmations) external",
    "function updateSubscriptionId(uint64 newSubscriptionId) external",
    "function getVRFConfig() external view returns (uint64 subscriptionId, bytes32 keyHashValue, uint32 gasLimit, uint16 confirmations)",
  "function owner() external view returns (address)",
    "event BetPlaced(address indexed player, uint256 amount, uint256 requestId)",
    "event GameResult(address indexed player, uint256 amount, bool won, uint256 rouletteResult, uint256 payout, uint256 requestId)",
    "event HouseBalanceUpdated(uint256 newBalance)",
    "event VRFRequested(uint256 requestId, address player, uint256 amount)"
  ],
  
  // Configurações da rede
  NETWORK: {
    // Rede Local (Hardhat/Ganache)
    LOCAL: {
      chainId: "0x7A69", // 31337 em hexadecimal
      chainName: "Hardhat Local",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18
      },
      rpcUrls: ["http://127.0.0.1:8545"],
      blockExplorerUrls: []
    },
    
    // Sepolia Testnet
    SEPOLIA: {
      chainId: "0xaa36a7",
      chainName: "Sepolia Testnet",
      nativeCurrency: {
        name: "Sepolia Ether",
        symbol: "SEP",
        decimals: 18
      },
      rpcUrls: ["https://sepolia.infura.io/v3/YOUR-PROJECT-ID"],
      blockExplorerUrls: ["https://sepolia.etherscan.io"]
    },
    
    // Mumbai Testnet (Polygon)
    MUMBAI: {
      chainId: "0x13881",
      chainName: "Mumbai Testnet",
      nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18
      },
      rpcUrls: ["https://polygon-mumbai.infura.io/v3/YOUR-PROJECT-ID"],
      blockExplorerUrls: ["https://mumbai.polygonscan.com"]
    }
  }
};

// Configurações da aplicação
export const APP_CONFIG = {
  // Tempo máximo para aguardar resultado (segundos)
  MAX_WAIT_TIME: 30,
  
  // Intervalo para verificar resultado (milissegundos)
  CHECK_INTERVAL: 1000,
  
  // Configurações de notificação
  TOAST_CONFIG: {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    newestOnTop: false,
    closeOnClick: true,
    rtl: false,
    pauseOnFocusLoss: true,
    draggable: true,
    pauseOnHover: true
  }
};

// Função para obter configuração da rede
export const getNetworkConfig = (networkName) => {
  return CONTRACT_CONFIG.NETWORK[networkName.toUpperCase()];
};

// Função para adicionar rede ao MetaMask
export const addNetworkToMetaMask = async (networkName) => {
  try {
    const networkConfig = getNetworkConfig(networkName);
    if (!networkConfig) {
      throw new Error(`Rede ${networkName} não configurada`);
    }
    
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [networkConfig]
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao adicionar rede:', error);
    return false;
  }
}; 