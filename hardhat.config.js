// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Corrigir nomes das variáveis de ambiente para coincidir com o .env
const SEPOLIA_URL = process.env.SEPOLIA_URL || "https://sepolia.infura.io/v3/example";
let PRIVATE_KEY = process.env.PRIVATE_KEY || "0xkey";
if (!PRIVATE_KEY.startsWith("0x")) {
  PRIVATE_KEY = "0x" + PRIVATE_KEY;
}
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "key";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_URL, // Corrigido para SEPOLIA_URL
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true
  }
};