require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20", // Ou a versão que você está usando
  networks: {
    sepolia: {
      // Se a variável de ambiente não existir, usa uma string vazia ""
      url: process.env.SEPOLIA_RPC_URL || "", 
      
      // Se a chave privada não existir, usa um array vazio []
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};