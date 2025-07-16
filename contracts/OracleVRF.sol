// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

contract OracleVRF is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface COORDINATOR;

    uint64 public subscriptionId;
    address public owner;
    bytes32 public keyHash;
    uint256 public randomNumber;

    constructor(
        uint64 _subId,
        address _vrfCoordinator,
        bytes32 _key
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        owner = msg.sender;
        subscriptionId = _subId;
        keyHash = _key;
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
    }

    function requestRandomNumber() external {
        require(msg.sender == owner, "somente o dono pode requisitar");
        COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            3, // confirmações
            100000, // gas
            1 // apenas 1 número aleatório
        );
    }

    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        randomNumber = randomWords[0];
    }

    function getRandomNumber() external view returns (uint256) {
        return randomNumber;
    }
}
