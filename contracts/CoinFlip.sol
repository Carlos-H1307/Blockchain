// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Importações necessárias do Chainlink
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";

/**
 * @title Um contrato de cara ou coroa usando Chainlink VRF v2
 * @notice Este contrato permite que os usuários apostem em um resultado cara/coroa
 * @dev Usa Chainlink VRF para aleatoriedade segura.
 */
contract CoinFlip is VRFConsumerBaseV2, OwnerIsCreator {
    // === Variáveis de Estado ===

    // Configurações do Chainlink VRF
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_keyHash; // O gas lane
    uint32 private constant CALLBACK_GAS_LIMIT = 100000;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Variáveis da Aposta
    uint256 public betAmount = 0.0001 ether;

    // Mapeamentos para armazenar o estado das apostas pendentes
    // requestId => endereço do jogador
    mapping(uint256 => address) public s_pendingRequests;
    // requestId => palpite do jogador (true = cara, false = coroa)
    mapping(uint256 => bool) public s_playerGuess;

    // === Eventos ===
    event FlipRequested(uint256 indexed requestId, address indexed player, bool guess);
    event Result(uint256 indexed requestId, address indexed player, bool win, uint256 amount);

    // === Erros Customizados ===
    error CoinFlip__UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 flipState);
    error CoinFlip__TransferFailed();
    error CoinFlip__RequestNotFound();

    // === Funções ===

    /**
     * @param vrfCoordinatorV2 O endereço do contrato Coordenador do VRF na blockchain
     * @param subscriptionId O ID da sua subscrição no VRF
     * @param keyHash O "gas lane" para a rede (ex: Sepolia, Mainnet)
     */
    constructor(address vrfCoordinatorV2, uint64 subscriptionId, bytes32 keyHash)
        VRFConsumerBaseV2(vrfCoordinatorV2)
    {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        i_keyHash = keyHash;
    }

    /**
     * @notice Função principal para o jogador fazer a aposta.
     * @param guess O palpite do jogador (true para cara, false para coroa).
     * @return requestId O ID da requisição ao VRF.
     */
    function flip(bool guess) public payable returns (uint256 requestId) {
        require(msg.value == betAmount, "Aposta deve ser de 0.0001 ETH");

        // Solicita o número aleatório ao Coordenador do VRF
        requestId = i_vrfCoordinator.requestRandomWords(
            i_keyHash,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            CALLBACK_GAS_LIMIT,
            NUM_WORDS
        );

        // Armazena os dados da aposta pendente
        s_pendingRequests[requestId] = msg.sender;
        s_playerGuess[requestId] = guess;

        emit FlipRequested(requestId, msg.sender, guess);
        return requestId;
    }

    /**
     * @notice Esta é a função de "callback" que o Oráculo do VRF chama.
     * @dev Ela verifica o resultado e paga o vencedor.
     * @param requestId O ID da requisição original.
     * @param randomWords Um array de números aleatórios seguros.
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address player = s_pendingRequests[requestId];
        if (player == address(0)) {
            revert CoinFlip__RequestNotFound();
        }

        bool playerGuess = s_playerGuess[requestId];
        
        // Limpa o estado antes de qualquer transferência (checks-effects-interactions)
        delete s_pendingRequests[requestId];
        delete s_playerGuess[requestId];

        // Determina o resultado (0 = coroa, 1 = cara)
        uint256 result = randomWords[0] % 2;
        bool wasHeads = (result == 1);

        bool didWin = (playerGuess == wasHeads);

        if (didWin) {
            // Paga o dobro da aposta para o vencedor
            (bool success, ) = player.call{value: betAmount * 2}("");
            if (!success) {
                revert CoinFlip__TransferFailed();
            }
            emit Result(requestId, player, didWin, betAmount * 2);
        } else {
            // Se o jogador perdeu, o dinheiro fica no contrato
            emit Result(requestId, player, didWin, 0);
        }
    }

    /**
     * @notice Permite que o dono do contrato saque os lucros.
     */
    function withdraw() public {
        // OwnerIsCreator já garante que apenas o dono pode chamar
        require(msg.sender == owner(), "Apenas o dono pode sacar");
        uint256 amount = address(this).balance;
        (bool success, ) = owner().call{value: amount}("");
        if (!success) {
            revert CoinFlip__TransferFailed();
        }
    }

    /**
     * @notice Permite que o contrato receba ETH diretamente para fundos.
     */
    receive() external payable {}
    fallback() external payable {}

    // === Funções de Leitura ===

    function getBetAmount() public view returns (uint256) {
        return betAmount;
    }

    function getVrfCoordinator() public view returns (address) {
        return address(i_vrfCoordinator);
    }
}