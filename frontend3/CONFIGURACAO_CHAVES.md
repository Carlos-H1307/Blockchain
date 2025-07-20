# 🔑 Configuração das Chaves - Casino Roleta

## ✅ Chaves Configuradas

Suas chaves já foram configuradas nos seguintes arquivos:

### 📍 Endereços dos Contratos
- **CasinoRoletaVRF**: `0x9E545E3C0baAB3E08CdfD552C960A1050f373042`
- **VRFCoordinatorV2Mock**: `0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E`

### 🔗 Configurações VRF
- **Subscription ID**: `1`
- **Key Hash**: `0x47402dc428cde0d5d71c0f068364233633663a45c361952a16bb5a54e99f018e`

## 📁 Arquivos de Configuração

### 1. `src/config.js`
```javascript
// Endereço do contrato principal
ADDRESS: "0x9E545E3C0baAB3E08CdfD552C960A1050f373042"

// Configuração da rede local
LOCAL: {
  chainId: "0x7A69", // 31337 (Hardhat)
  chainName: "Hardhat Local",
  rpcUrls: ["http://127.0.0.1:8545"]
}
```

### 2. `src/vrf-config.js`
```javascript
// Configurações VRF
VRF_COORDINATOR: "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E"
SUBSCRIPTION_ID: "1"
KEY_HASH: "0x47402dc428cde0d5d71c0f068364233633663a45c361952a16bb5a54e99f018e"
```

## 🚀 Como Usar

### 1. Iniciar o Frontend
```bash
npm install
npm start
```

### 2. Configurar MetaMask
1. Abra o MetaMask
2. Clique em "Adicionar Rede"
3. Use as configurações da rede local:
   - **Nome da Rede**: Hardhat Local
   - **URL RPC**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Símbolo da Moeda**: ETH

### 3. Conectar Carteira
1. Acesse http://localhost:3000
2. Clique em "Conectar Carteira"
3. Autorize a conexão no MetaMask

### 4. Fazer Apostas
1. Digite um valor entre 0.001 e 0.005 ETH
2. Clique em "FAZER APOSTA"
3. Confirme a transação no MetaMask
4. Aguarde o resultado da roleta

## 🔧 Verificações Importantes

### ✅ Contrato Deployado
- Confirme que o contrato está implantado na rede local
- Verifique se o VRFCoordinatorV2Mock está funcionando

### ✅ Fundos no Contrato
- O contrato precisa ter fundos para pagar apostas
- Use a função `addHouseFunds()` para adicionar ETH

### ✅ Rede Local Ativa
- Certifique-se de que o Hardhat está rodando
- Verifique se o MetaMask está conectado à rede local

## 🐛 Solução de Problemas

### Erro: "Contrato não encontrado"
- Verifique se o Hardhat está rodando
- Confirme se o endereço do contrato está correto

### Erro: "Rede não suportada"
- Adicione a rede local ao MetaMask
- Use Chain ID: 31337

### Erro: "Casino nao tem fundos suficientes"
- Adicione fundos ao contrato usando `addHouseFunds()`

### Erro: "VRF não responde"
- Verifique se o VRFCoordinatorV2Mock está implantado
- Confirme se a subscription tem fundos

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Hardhat
2. Confirme as configurações do MetaMask
3. Teste com valores pequenos primeiro

---

**🎯 Pronto para jogar!** Suas chaves estão configuradas e o frontend está pronto para uso. 