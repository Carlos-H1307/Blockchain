// // hardhat.config.js
// require("@nomicfoundation/hardhat-toolbox");
// require("dotenv").config();

// // Corrigir nomes das variáveis de ambiente para coincidir com o .env
// const SEPOLIA_URL = process.env.SEPOLIA_URL || "https://sepolia.infura.io/v3/example";
// let PRIVATE_KEY = process.env.PRIVATE_KEY || "0xkey";
// if (!PRIVATE_KEY.startsWith("0x")) {
//   PRIVATE_KEY = "0x" + PRIVATE_KEY;
// }
// const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "key";

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.19",
//   defaultNetwork: "hardhat",
//   networks: {
//     hardhat: {
//       chainId: 31337,
//     },
//     sepolia: {
//       url: SEPOLIA_URL, // Corrigido para SEPOLIA_URL
//       accounts: [PRIVATE_KEY],
//       chainId: 11155111,
//     },
//   },
//   etherscan: {
//     apiKey: ETHERSCAN_API_KEY,
//   },
//   sourcify: {
//     enabled: true
//   }
// };

require("@nomicfoundation/hardhat-toolbox");
require("@chainlink/hardhat-chainlink");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      gas: 12000000,
      blockGasLimit: 12000000,
      allowUnlimitedContractSize: true,
      accounts: {
        count: 10,
        accountsBalance: "1000000000000000000000" // 1000 ETH per account
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  mocha: {
    timeout: 300000 // 5 minutes
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true
  }
};