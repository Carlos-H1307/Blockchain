// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract CoinFlip is VRFConsumerBaseV2 {
    event Result(address player, bool win, uint256 amount);

    address public owner;
    uint256 public betAmount = 0.01 ether;

    VRFCoordinatorV2Interface COORDINATOR;
    bytes32 keyHash;
    uint64 s_subscriptionId;
    uint16 requestConfirmations = 3;
    uint32 callbackGasLimit = 100000;

    struct Bet {
        address player;
        bool guess;
        uint256 amount;
    }

    mapping(uint256 => Bet) public bets;

    constructor(
        address vrfCoordinator,
        bytes32 _keyHash,
        uint64 subscriptionId
    ) VRFConsumerBaseV2(vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        keyHash = _keyHash;
        s_subscriptionId = subscriptionId;
        owner = msg.sender;
    }

    function flip(bool guess) external payable {
        require(msg.value == betAmount, "Aposta deve ser de 0.01 ETH");

        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            1
        );

        bets[requestId] = Bet(msg.sender, guess, msg.value);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        Bet memory bet = bets[requestId];
        bool result = randomWords[0] % 2 == 0; // true = cara, false = coroa

        if (bet.guess == result) {
            payable(bet.player).transfer(bet.amount * 2);
            emit Result(bet.player, true, bet.amount);
        } else {
            emit Result(bet.player, false, bet.amount);
        }

        delete bets[requestId];
    }

    function fundContract() external payable {}

    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
}
