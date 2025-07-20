// Script para debug do contrato
import { ethers } from 'ethers';
import { CONTRACT_CONFIG } from './config.js';

export const debugContract = async () => {
  try {
    // Conectar ao provider local
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    
    // Verificar se o contrato existe
    const code = await provider.getCode(CONTRACT_CONFIG.ADDRESS);
    
    if (code === "0x") {
      console.error("❌ Contrato não encontrado na rede local!");
      console.log("Endereço:", CONTRACT_CONFIG.ADDRESS);
      console.log("Verifique se:");
      console.log("1. O Hardhat está rodando");
      console.log("2. O contrato foi implantado");
      console.log("3. O endereço está correto");
      return false;
    }
    
    console.log("✅ Contrato encontrado!");
    console.log("Endereço:", CONTRACT_CONFIG.ADDRESS);
    console.log("Código do contrato:", code.slice(0, 66) + "...");
    
    // Tentar chamar funções básicas
    const contract = new ethers.Contract(
      CONTRACT_CONFIG.ADDRESS, 
      CONTRACT_CONFIG.ABI, 
      provider
    );
    
    try {
      const minBet = await contract.MIN_BET();
      console.log("✅ MIN_BET():", ethers.formatEther(minBet), "ETH");
    } catch (error) {
      console.error("❌ Erro ao chamar MIN_BET():", error.message);
    }
    
    try {
      const maxBet = await contract.MAX_BET();
      console.log("✅ MAX_BET():", ethers.formatEther(maxBet), "ETH");
    } catch (error) {
      console.error("❌ Erro ao chamar MAX_BET():", error.message);
    }
    
    try {
      const paused = await contract.paused();
      console.log("✅ paused():", paused);
    } catch (error) {
      console.error("❌ Erro ao chamar paused():", error.message);
    }
    
    return true;
    
  } catch (error) {
    console.error("❌ Erro ao conectar com a rede local:", error.message);
    return false;
  }
}; 