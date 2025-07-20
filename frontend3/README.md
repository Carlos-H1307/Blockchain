# 🎰 Casino Roleta - Frontend

Frontend moderno e responsivo para o contrato de casino de roleta na blockchain, desenvolvido com React e Bootstrap.

## 🚀 Características

- **Interface Moderna**: Design responsivo com Bootstrap 5
- **Integração Web3**: Conexão com carteiras Ethereum (MetaMask)
- **Animações**: Efeitos visuais para vitórias e derrotas
- **Estatísticas**: Dashboard completo com estatísticas do jogador e casino
- **Notificações**: Sistema de toast para feedback do usuário
- **Suporte Multi-rede**: Configuração para diferentes redes de teste

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- MetaMask ou outra carteira Web3
- Contrato de casino de roleta implantado na blockchain

## 🛠️ Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd casino-roleta-frontend
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o contrato**
   
   Abra o arquivo `src/config.js` e atualize:
   ```javascript
   export const CONTRACT_CONFIG = {
     // Substitua pelo endereço real do seu contrato
     ADDRESS: "0xSEU_ENDERECO_DO_CONTRATO_AQUI",
     
     // Configure a rede desejada
     NETWORK: {
       SEPOLIA: {
         // ... configurações da rede
       }
     }
   };
   ```

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm start
   ```

5. **Acesse a aplicação**
   
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## ⚙️ Configuração

### Configuração do Contrato

1. **Endereço do Contrato**: Atualize `CONTRACT_CONFIG.ADDRESS` no arquivo `src/config.js`
2. **Rede**: Configure a rede desejada em `CONTRACT_CONFIG.NETWORK`
3. **ABI**: O ABI já está configurado para as funções principais do contrato

### Configuração da Rede

O projeto suporta diferentes redes de teste:

- **Sepolia Testnet** (Ethereum)
- **Mumbai Testnet** (Polygon)

Para adicionar uma nova rede, edite o arquivo `src/config.js`:

```javascript
NETWORK: {
  SUA_REDE: {
    chainId: "0x...",
    chainName: "Nome da Rede",
    nativeCurrency: {
      name: "Nome da Moeda",
      symbol: "SIMBOLO",
      decimals: 18
    },
    rpcUrls: ["URL_DO_RPC"],
    blockExplorerUrls: ["URL_DO_EXPLORER"]
  }
}
```

## 🎮 Como Jogar

1. **Conecte sua Carteira**
   - Clique em "Conectar Carteira"
   - Autorize a conexão no MetaMask

2. **Faça uma Aposta**
   - Digite o valor da aposta (entre 0.001 e 0.005 ETH)
   - Clique em "FAZER APOSTA"

3. **Aguarde o Resultado**
   - A roleta girará automaticamente
   - O resultado será determinado pelo Chainlink VRF
   - Seções 1-25: Verde (ganha 2x)
   - Seções 26-50: Vermelho (perde)

4. **Veja suas Estatísticas**
   - Clique em "📊 Estatísticas" para ver dados detalhados
   - Acompanhe vitórias, derrotas e lucro/prejuízo

## 🏗️ Estrutura do Projeto

```
src/
├── App.js              # Componente principal
├── index.js            # Ponto de entrada
├── index.css           # Estilos globais
├── config.js           # Configurações do contrato e app
└── components/         # Componentes reutilizáveis (futuro)
```

## 🔧 Funcionalidades

### Para Jogadores
- ✅ Conectar carteira Web3
- ✅ Fazer apostas
- ✅ Visualizar resultados em tempo real
- ✅ Ver estatísticas pessoais
- ✅ Animações de vitória/derrota

### Para Administradores
- ✅ Visualizar estatísticas do casino
- ✅ Monitorar saldo da casa
- ✅ Ver apostas pendentes
- ✅ Acompanhar pagamentos totais

## 🎨 Personalização

### Cores e Temas
Edite o arquivo `src/index.css` para personalizar:
- Cores da roleta
- Gradientes de fundo
- Animações
- Estilos dos botões

### Componentes Bootstrap
O projeto usa React Bootstrap. Consulte a [documentação oficial](https://react-bootstrap.github.io/) para personalizar componentes.

## 🚀 Deploy

### Build para Produção
```bash
npm run build
```

### Deploy no Netlify
1. Conecte seu repositório ao Netlify
2. Configure o build command: `npm run build`
3. Configure o publish directory: `build`

### Deploy no Vercel
1. Conecte seu repositório ao Vercel
2. O deploy será automático

## 🔒 Segurança

- ✅ Validação de entrada do usuário
- ✅ Verificação de limites de aposta
- ✅ Tratamento de erros de transação
- ✅ Timeout para operações longas

## 🐛 Solução de Problemas

### Erro de Conexão com MetaMask
- Verifique se o MetaMask está instalado
- Certifique-se de estar na rede correta
- Tente recarregar a página

### Erro de Transação
- Verifique se tem ETH suficiente
- Confirme se o valor está dentro dos limites
- Verifique se o contrato não está pausado

### Resultado não Aparece
- Aguarde até 30 segundos
- Verifique se a transação foi confirmada
- Recarregue a página se necessário

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte, entre em contato através de:
- Email: seu-email@exemplo.com
- GitHub Issues: [Link para issues]

---

**Desenvolvido com ❤️ para a comunidade blockchain** 