# 🚀 Instalação Rápida

Guia rápido para instalar e executar o frontend do Casino Roleta.

## 📋 Pré-requisitos

- Node.js 16+ 
- npm ou yarn
- MetaMask instalado no navegador

## ⚡ Instalação em 3 Passos

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Contrato
Edite `src/config.js` e substitua o endereço do contrato:
```javascript
ADDRESS: "0xSEU_ENDERECO_DO_CONTRATO_AQUI"
```

### 3. Executar
```bash
npm start
```

Acesse: http://localhost:3000

## 🎯 Funcionalidades Principais

- ✅ Conectar carteira Web3
- ✅ Fazer apostas (0.001 - 0.005 ETH)
- ✅ Visualizar resultados em tempo real
- ✅ Estatísticas do jogador e casino
- ✅ Animações de vitória/derrota
- ✅ Design responsivo

## 🔧 Configuração Avançada

Veja `CONTRACT_SETUP.md` para configuração completa do contrato.

## 🐛 Problemas Comuns

**Erro: "MetaMask não encontrado"**
- Instale a extensão MetaMask
- Recarregue a página

**Erro: "Rede não suportada"**
- Configure a rede correta no MetaMask
- Veja configurações em `src/config.js`

**Erro: "Contrato não encontrado"**
- Verifique o endereço em `src/config.js`
- Confirme se o contrato está implantado

---

**Precisa de ajuda?** Veja o `README.md` completo! 