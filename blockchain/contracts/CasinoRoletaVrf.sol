// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/**
 * @title CasinoRoletaVRF
 * @dev Smart contract para um casino de roleta da fortuna usando Chainlink VRF
 * 50 seções: 25 vermelhas (perdem) e 25 verdes (ganham 2x)
 */
contract CasinoRoletaVRF is VRFConsumerBaseV2, ConfirmedOwner {
    VRFCoordinatorV2Interface COORDINATOR;

    // Configurações do Chainlink VRF
    uint64 s_subscriptionId;
    bytes32 keyHash;
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

    // Variáveis do casino
    uint256 public houseBalance;
    uint256 public constant MIN_BET = 0.001 ether;
    uint256 public constant MAX_BET = 0.005 ether;
    bool public paused = false;
    
    // Eventos
    event BetPlaced(address indexed player, uint256 amount, uint256 requestId);
    event GameResult(
        address indexed player, 
        uint256 amount, 
        bool won, 
        uint256 rouletteResult, 
        uint256 payout,
        uint256 requestId
    );
    event HouseBalanceUpdated(uint256 newBalance);
    event VRFRequested(uint256 requestId, address player, uint256 amount);
    
    // Estrutura para armazenar apostas pendentes
    struct Bet {
        address player;
        uint256 amount;
        bool active;
        uint256 timestamp;
    }
    
    // Mapeamento de requestId do VRF para apostas
    mapping(uint256 => Bet) public pendingBets;
    
    // Estatísticas
    mapping(address => uint256) public playerWins;
    mapping(address => uint256) public playerLosses;
    mapping(address => uint256) public playerTotalBet;
    mapping(address => uint256) public playerTotalWon;
    uint256 public totalBetsPlaced;
    uint256 public totalPayouts;
    uint256 public pendingBetsCount;
    
    modifier validBet() {
        require(msg.value >= MIN_BET, "Aposta muito baixa");
        require(msg.value <= MAX_BET, "Aposta muito alta");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contrato pausado");
        _;
    }

    /**
     * @dev Constructor - configura o Chainlink VRF
     * param subscriptionId - ID da subscricao do Chainlink VRF
     * param vrfCoordinator - Endereco do VRF Coordinator
     * param keyHash - Key hash para o VRF
     */
    constructor(
        uint64 subscriptionId,
        address vrfCoordinator,
        bytes32 keyHash_
    ) VRFConsumerBaseV2(vrfCoordinator) ConfirmedOwner(msg.sender) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
        keyHash = keyHash_;
        houseBalance = 0;
    }

    /**
     * @dev Permite que o dono adicione fundos ao casino
     */
    function addHouseFunds() external payable onlyOwner {
        houseBalance += msg.value;
        emit HouseBalanceUpdated(houseBalance);
    }
    
    /**
     * @dev Permite que o dono retire fundos do casino
     */
    function withdrawHouseFunds(uint256 amount) external onlyOwner {
        require(amount <= houseBalance, "Saldo insuficiente na casa");
        require(amount <= address(this).balance, "Contrato sem saldo suficiente");
        
        houseBalance -= amount;
        payable(owner()).transfer(amount);
        emit HouseBalanceUpdated(houseBalance);
    }
    
    /**
     * @dev Função principal para fazer uma aposta
     */
    function placeBet() external payable validBet whenNotPaused {
        uint256 potentialPayout = msg.value * 2; // 2x se ganhar
        
        // Verifica se o casino tem fundos suficientes para pagar
        require(houseBalance >= msg.value, "Casino nao tem fundos suficientes");
        
        // Solicita número aleatório do Chainlink VRF
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        
        // Armazena a aposta pendente
        pendingBets[requestId] = Bet({
            player: msg.sender,
            amount: msg.value,
            active: true,
            timestamp: block.timestamp
        });
        
        pendingBetsCount++;
        
        // Atualiza estatísticas do jogador
        playerTotalBet[msg.sender] += msg.value;
        
        emit BetPlaced(msg.sender, msg.value, requestId);
        emit VRFRequested(requestId, msg.sender, msg.value);
    }
    
    /**
     * @dev Callback do Chainlink VRF - executa automaticamente quando o número aleatório chega
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        require(pendingBets[requestId].active, "Aposta nao ativa ou ja processada");
        
        Bet storage bet = pendingBets[requestId];
        uint256 randomResult = randomWords[0];
        
        // Converte para resultado da roleta (1 a 50)
        uint256 rouletteResult = (randomResult % 50) + 1;
        
        bool won = false;
        uint256 payout = 0;
        
        // Seções 1-25 = Verde (ganha), 26-50 = Vermelho (perde)
        if (rouletteResult <= 25) {
            // Verde - jogador ganha 2x
            won = true;
            payout = bet.amount * 2;
            
            // Verifica se a casa ainda tem fundos suficientes
            if (houseBalance >= bet.amount && address(this).balance >= payout) {
                // Transfere o pagamento
                houseBalance -= bet.amount; // Casa perde a aposta original
                payable(bet.player).transfer(payout);
                
                // Atualiza estatísticas
                playerWins[bet.player]++;
                playerTotalWon[bet.player] += payout;
                totalPayouts += payout;
            } else {
                // Caso de emergência - casa não tem fundos
                won = false;
                payout = 0;
                // Retorna a aposta original para o jogador
                payable(bet.player).transfer(bet.amount);
            }
        } else {
            // Vermelho - casa ganha
            won = false;
            payout = 0;
            
            // Adiciona a aposta ao saldo da casa
            houseBalance += bet.amount;
            
            // Atualiza estatísticas
            playerLosses[bet.player]++;
        }
        
        // Marca aposta como processada
        bet.active = false;
        totalBetsPlaced++;
        pendingBetsCount--;
        
        emit GameResult(bet.player, bet.amount, won, rouletteResult, payout, requestId);
        emit HouseBalanceUpdated(houseBalance);
    }
    
    /**
     * @dev Função de emergência para resolver apostas pendentes muito antigas
     * Só pode ser usada após 1 hora da aposta
     */
    function resolveStuckBet(uint256 requestId) external onlyOwner {
        require(pendingBets[requestId].active, "Aposta nao ativa");
        require(
            block.timestamp >= pendingBets[requestId].timestamp + 1 hours,
            "Aposta muito recente"
        );
        
        Bet storage bet = pendingBets[requestId];
        
        // Retorna a aposta para o jogador
        payable(bet.player).transfer(bet.amount);
        
        // Marca como resolvida
        bet.active = false;
        pendingBetsCount--;
        
        emit GameResult(bet.player, bet.amount, false, 0, bet.amount, requestId);
    }
    
    /**
     * @dev Retorna informações detalhadas do jogador
     */
    function getPlayerStats(address player) external view returns (
        uint256 wins,
        uint256 losses,
        uint256 totalGames,
        uint256 totalBetAmount,
        uint256 totalWonAmount,
        uint256 netResult
    ) {
        wins = playerWins[player];
        losses = playerLosses[player];
        totalGames = wins + losses;
        totalBetAmount = playerTotalBet[player];
        totalWonAmount = playerTotalWon[player];
        
        if (totalWonAmount >= totalBetAmount) {
            netResult = totalWonAmount - totalBetAmount; // Lucro
        } else {
            netResult = totalBetAmount - totalWonAmount; // Prejuízo
        }
    }
    
    /**
     * @dev Retorna estatísticas gerais do casino
     */
    function getCasinoStats() external view returns (
        uint256 balance,
        uint256 totalBets,
        uint256 totalPayoutsAmount,
        uint256 contractBalance,
        uint256 pendingBets,
        bool isPaused
    ) {
        balance = houseBalance;
        totalBets = totalBetsPlaced;
        totalPayoutsAmount = totalPayouts;
        contractBalance = address(this).balance;
        pendingBets = pendingBetsCount;
        isPaused = paused;
    }
    
    /**
     * @dev Permite verificar uma aposta específica
     */
    function getBetInfo(uint256 requestId) external view returns (
        address player,
        uint256 amount,
        bool active,
        uint256 timestamp
    ) {
        Bet storage bet = pendingBets[requestId];
        return (bet.player, bet.amount, bet.active, bet.timestamp);
    }
    
    /**
     * @dev Controles de pausa
     */
    function pause() external onlyOwner {
        paused = true;
    }
    
    function unpause() external onlyOwner {
        paused = false;
    }
    
    /**
     * @dev Atualiza configurações do VRF
     */
    function updateVRFConfig(
        bytes32 newKeyHash,
        uint32 newCallbackGasLimit,
        uint16 newRequestConfirmations
    ) external onlyOwner {
        keyHash = newKeyHash;
        callbackGasLimit = newCallbackGasLimit;
        requestConfirmations = newRequestConfirmations;
    }
    
    /**
     * @dev Atualiza subscription ID
     */
    function updateSubscriptionId(uint64 newSubscriptionId) external onlyOwner {
        s_subscriptionId = newSubscriptionId;
    }
    
    /**
     * @dev Retorna configurações atuais do VRF
     */
    function getVRFConfig() external view returns (
        uint64 subscriptionId,
        bytes32 keyHashValue,
        uint32 gasLimit,
        uint16 confirmations
    ) {
        return (s_subscriptionId, keyHash, callbackGasLimit, requestConfirmations);
    }
    
    /**
     * @dev Função para receber Ether diretamente
     */
    receive() external payable {
        houseBalance += msg.value;
        emit HouseBalanceUpdated(houseBalance);
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        houseBalance += msg.value;
        emit HouseBalanceUpdated(houseBalance);
    }
}