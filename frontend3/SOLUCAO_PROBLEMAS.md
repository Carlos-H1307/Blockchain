# 🔧 Solução do Erro "could not decode result data"

## 🚨 Problema Identificado

O erro `could not decode result data` indica que o contrato não está respondendo corretamente. Isso pode acontecer por vários motivos:

## 🔍 Diagnóstico

### 1. **Verificar se o Hardhat está rodando**
```bash
# No terminal onde você rodou o Hardhat, deve aparecer algo como:
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### 2. **Verificar se o contrato foi implantado**
```bash
# No terminal do Hardhat, procure por:
# CasinoRoletaVRF deployed to: 0x9E545E3C0baAB3E08CdfD552C960A1050f373042
```

### 3. **Usar o botão Debug**
1. Conecte sua carteira no frontend
2. Clique no botão "🔍 Debug"
3. Abra o console do navegador (F12)
4. Verifique as mensagens de debug

## 🛠️ Soluções

### **Solução 1: Reimplantar o Contrato**

Se o contrato não foi implantado corretamente:

```bash
# 1. Pare o Hardhat (Ctrl+C)
# 2. Inicie novamente
npx hardhat node

# 3. Em outro terminal, implante o contrato
npx hardhat run scripts/deploy.js --network localhost
```

### **Solução 2: Verificar Endereço do Contrato**

Confirme se o endereço no `src/config.js` está correto:

```javascript
ADDRESS: "0x9E545E3C0baAB3E08CdfD552C960A1050f373042"
```

### **Solução 3: Verificar ABI**

O ABI pode estar incompleto. Atualize o ABI no `src/config.js`:

```javascript
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
  "event BetPlaced(address indexed player, uint256 amount, uint256 requestId)",
  "event GameResult(address indexed player, uint256 amount, bool won, uint256 rouletteResult, uint256 payout, uint256 requestId)",
  "event HouseBalanceUpdated(uint256 newBalance)",
  "event VRFRequested(uint256 requestId, address player, uint256 amount)"
]
```

### **Solução 4: Verificar Rede no MetaMask**

Certifique-se de que o MetaMask está conectado à rede local:

1. Abra o MetaMask
2. Clique no seletor de rede
3. Selecione "Hardhat Local" ou adicione:
   - **Nome**: Hardhat Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Símbolo**: ETH

### **Solução 5: Verificar Conta no MetaMask**

1. Certifique-se de que a conta tem ETH
2. Use a conta que foi usada para implantar o contrato
3. Verifique se não há transações pendentes

## 🔍 Debug Avançado

### **Verificar no Console do Hardhat**

No terminal onde o Hardhat está rodando, você deve ver:

```
eth_call
  Contract call:       CasinoRoletaVRF#MIN_BET
  From:               0x...
  To:                 0x9E545E3C0baAB3E08CdfD552C960A1050f373042
```

### **Verificar no Console do Navegador**

Abra o console (F12) e procure por:

```
🔍 Verificando contrato...
✅ Contrato encontrado!
✅ MIN_BET(): 0.001 ETH
```

## 📋 Checklist de Verificação

- [ ] Hardhat está rodando em http://127.0.0.1:8545
- [ ] Contrato foi implantado com sucesso
- [ ] Endereço do contrato está correto no config.js
- [ ] MetaMask está conectado à rede local
- [ ] Conta tem ETH suficiente
- [ ] ABI está completo e correto
- [ ] VRFCoordinatorV2Mock foi implantado

## 🆘 Se Nada Funcionar

1. **Reinicie tudo**:
   ```bash
   # Terminal 1: Pare o Hardhat
   # Terminal 2: Pare o frontend (Ctrl+C)
   
   # Terminal 1: Inicie o Hardhat
   npx hardhat node
   
   # Terminal 2: Implante o contrato
   npx hardhat run scripts/deploy.js --network localhost
   
   # Terminal 2: Inicie o frontend
   npm start
   ```

2. **Verifique os logs**:
   - Console do Hardhat
   - Console do navegador
   - Console do frontend

3. **Teste com valores pequenos**:
   - Use 0.001 ETH para teste
   - Verifique se o contrato tem fundos

---

**💡 Dica**: O botão "🔍 Debug" no frontend vai te ajudar a identificar exatamente onde está o problema! 