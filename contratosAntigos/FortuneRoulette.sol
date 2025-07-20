// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// 0x76430d7e1fdc231c325039d5Dc69dc490eC6bb9e

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract FortuneRoulette is VRFConsumerBaseV2 {
    address public owner;
    VRFCoordinatorV2Interface COORDINATOR;
    bytes32 public keyHash;
    uint64 public subscriptionId;

    uint256 public latestRequestId;

    struct Bet {
        address player;
        uint256 amount;
    }

    mapping(uint256 => Bet) public bets;

    event Requested(uint256 requestId, address player, uint256 amount);
    event Result(address player, uint256 valueSent, uint256 random, uint256 payout);

    constructor(
        uint64 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        owner = msg.sender;
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
    }

    function play() external payable {
        require(msg.value > 0, "Envie algum valor para apostar");

        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            3,       // confirmações
            200000,  // limite de gas
            1        // número de palavras aleatórias
        );

        bets[requestId] = Bet({
            player: msg.sender,
            amount: msg.value
        });

        emit Requested(requestId, msg.sender, msg.value);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        Bet memory bet = bets[requestId];
        require(bet.amount > 0, "Aposta invalida");

        uint256 result = randomWords[0] % 4;
        uint256 payout;

        if (result == 0) {
            payout = 0;
        } else if (result == 1) {
            payout = (bet.amount * 5) / 10;
        } else if (result == 2) {
            payout = bet.amount;
        } else {
            payout = bet.amount * 2;
        }

        if (payout > 0 && address(this).balance >= payout) {
            payable(bet.player).transfer(payout);
        }

        emit Result(bet.player, bet.amount, result, payout);

        delete bets[requestId]; // limpeza
    }

    function fundContract() external payable {}

    function withdraw() external {
        require(msg.sender == owner, "Somente o dono");
        payable(owner).transfer(address(this).balance);
    }

    receive() external payable {}
}
