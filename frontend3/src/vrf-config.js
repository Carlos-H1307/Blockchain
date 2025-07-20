// Configurações do Chainlink VRF
export const VRF_CONFIG = {
  // Endereço do VRF Coordinator (Mock para rede local)
  VRF_COORDINATOR: "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E",
  
  // Subscription ID do Chainlink VRF
  SUBSCRIPTION_ID: "1",
  
  // Key Hash do Chainlink VRF
  KEY_HASH: "0x47402dc428cde0d5d71c0f068364233633663a45c361952a16bb5a54e99f018e",
  
  // Configurações de gas
  CALLBACK_GAS_LIMIT: 100000,
  REQUEST_CONFIRMATIONS: 3,
  NUM_WORDS: 1
};

// Configurações da rede local (Hardhat/Ganache)
export const LOCAL_NETWORK_CONFIG = {
  chainId: "0x7A69", // 31337 em hexadecimal
  chainName: "Hardhat Local",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: ["http://127.0.0.1:8545"],
  blockExplorerUrls: []
};

// Função para obter configuração VRF completa
export const getVRFConfig = () => {
  return {
    coordinator: VRF_CONFIG.VRF_COORDINATOR,
    subscriptionId: VRF_CONFIG.SUBSCRIPTION_ID,
    keyHash: VRF_CONFIG.KEY_HASH,
    callbackGasLimit: VRF_CONFIG.CALLBACK_GAS_LIMIT,
    requestConfirmations: VRF_CONFIG.REQUEST_CONFIRMATIONS,
    numWords: VRF_CONFIG.NUM_WORDS
  };
};

// Função para adicionar rede local ao MetaMask
export const addLocalNetworkToMetaMask = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [LOCAL_NETWORK_CONFIG]
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao adicionar rede local:', error);
    return false;
  }
}; 