# 🔧 Configuração do Contrato

Este guia explica como configurar o frontend para trabalhar com o contrato de casino de roleta.

## 📋 Pré-requisitos

1. **Contrato Implantado**: O contrato `CasinoRoletaVRF` deve estar implantado na blockchain
2. **Chainlink VRF**: Configurado e funcionando
3. **Fundos**: O contrato deve ter fundos suficientes para pagar apostas

## ⚙️ Configuração do Frontend

### 1. Atualizar Endereço do Contrato

Edite o arquivo `src/config.js`:

```javascript
export const CONTRACT_CONFIG = {
  // Substitua pelo endereço real do seu contrato
  ADDRESS: "0x1234567890123456789012345678901234567890", // SEU ENDEREÇO AQUI
  
  // ... resto da configuração
};
```

### 2. Configurar Rede

Escolha a rede onde seu contrato está implantado:

#### Para Sepolia Testnet:
```javascript
NETWORK: {
  SEPOLIA: {
    chainId: "0xaa36a7",
    chainName: "Sepolia Testnet",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "SEP",
      decimals: 18
    },
    rpcUrls: ["https://sepolia.infura.io/v3/SEU-PROJECT-ID"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"]
  }
}
```

#### Para Mumbai Testnet (Polygon):
```javascript
NETWORK: {
  MUMBAI: {
    chainId: "0x13881",
    chainName: "Mumbai Testnet",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18
    },
    rpcUrls: ["https://polygon-mumbai.infura.io/v3/SEU-PROJECT-ID"],
    blockExplorerUrls: ["https://mumbai.polygonscan.com"]
  }
}
```

### 3. Configurar Infura (Opcional)

Se estiver usando Infura, substitua `SEU-PROJECT-ID` pelo seu Project ID real.

## 🚀 Deploy do Contrato

### 1. Usando Hardhat

```bash
# Instalar dependências
npm install

# Compilar contrato
npx hardhat compile

# Deploy em rede de teste
npx hardhat run scripts/deploy.js --network sepolia
```

### 2. Script de Deploy

Crie um arquivo `scripts/deploy.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  // Configurações do Chainlink VRF
  const VRF_COORDINATOR = "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed"; // Sepolia
  const SUBSCRIPTION_ID = "SEU_SUBSCRIPTION_ID"; // Obtenha em https://vrf.chain.link/
  const KEY_HASH = "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f"; // Sepolia

  // Deploy do contrato
  const CasinoRoletaVRF = await ethers.getContractFactory("CasinoRoletaVRF");
  const casino = await CasinoRoletaVRF.deploy(
    SUBSCRIPTION_ID,
    VRF_COORDINATOR,
    KEY_HASH
  );

  await casino.deployed();

  console.log("CasinoRoletaVRF deployed to:", casino.address);
  
  // Adicionar fundos iniciais
  const fundAmount = ethers.utils.parseEther("1.0"); // 1 ETH
  await casino.addHouseFunds({ value: fundAmount });
  
  console.log("Fundos iniciais adicionados:", ethers.utils.formatEther(fundAmount), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### 3. Configurar Chainlink VRF

1. Acesse [Chainlink VRF](https://vrf.chain.link/)
2. Crie uma nova subscription
3. Adicione fundos à subscription
4. Use o Subscription ID no deploy

## 🔍 Verificação

### 1. Verificar Contrato no Etherscan

```bash
npx hardhat verify --network sepolia ENDERECO_DO_CONTRATO SUBSCRIPTION_ID VRF_COORDINATOR KEY_HASH
```

### 2. Testar Funcionalidades

1. Conecte o frontend
2. Faça uma aposta pequena
3. Verifique se o resultado aparece
4. Confirme se as estatísticas são atualizadas

## 🛠️ Comandos Úteis

### Verificar Saldo do Contrato
```javascript
const balance = await casino.getCasinoStats();
console.log("Saldo da casa:", ethers.utils.formatEther(balance.balance), "ETH");
```

### Adicionar Fundos
```javascript
await casino.addHouseFunds({ value: ethers.utils.parseEther("0.5") });
```

### Pausar/Despausar
```javascript
await casino.pause();   // Pausar
await casino.unpause(); // Despausar
```

## 🐛 Solução de Problemas

### Erro: "Casino nao tem fundos suficientes"
- Adicione fundos ao contrato usando `addHouseFunds()`
- Verifique se o saldo da casa é suficiente

### Erro: "Contrato pausado"
- Use `unpause()` para reativar o contrato
- Apenas o owner pode fazer isso

### Erro: "Aposta muito baixa/alta"
- Verifique os limites: MIN_BET = 0.001 ETH, MAX_BET = 0.005 ETH
- Ajuste o valor da aposta

### Erro de VRF
- Verifique se a subscription tem fundos
- Confirme se o KEY_HASH está correto
- Verifique se o callback gas limit é suficiente

## 📞 Suporte

Para problemas específicos do contrato:
1. Verifique os logs do deploy
2. Confirme as configurações do VRF
3. Teste em rede local primeiro
4. Consulte a documentação do Chainlink VRF

---

**Lembre-se**: Sempre teste em rede de teste antes de ir para produção! 