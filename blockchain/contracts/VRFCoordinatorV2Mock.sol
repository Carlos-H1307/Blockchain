// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

/**
 * @title VRFCoordinatorV2Mock
 * @dev Mock completo para o Chainlink VRF V2 para testes locais.
 */
contract VRFCoordinatorV2Mock is VRFCoordinatorV2Interface {
    uint96 private _baseFee;
    uint96 private _gasPriceLink;
    uint64 private _subIdCounter;
    
    struct Subscription {
        address owner;
        uint96 balance;
    }

    event SubscriptionCreated(uint64 subId); // <-- ADICIONE ESTA LINHA

    mapping(uint64 => Subscription) private s_subscriptions;
    mapping(uint256 => bool) public requestExists;
    
    // Armazena o último request para que o teste possa usá-lo
    uint256 public lastRequestId;
    address public lastConsumer;

    constructor(uint96 baseFee, uint96 gasPriceLink) {
        _baseFee = baseFee;
        _gasPriceLink = gasPriceLink;
        _subIdCounter = 0;
    }

    function createSubscription() external override returns (uint64 subId) {
        _subIdCounter++;
        subId = _subIdCounter;
        s_subscriptions[subId] = Subscription({
            owner: msg.sender,
            balance: 0
        });
        emit SubscriptionCreated(subId); // <-- ADICIONE ESTA LINHA
        return subId;
    }
    
    function requestRandomWords(
        bytes32, /* keyHash */
        uint64 subId,
        uint16, /* requestConfirmations */
        uint32, /* callbackGasLimit */
        uint32 /* numWords */
    ) external override returns (uint256 requestId) {
        require(s_subscriptions[subId].balance >= _baseFee, "Subscription has insufficient funds");
        
        requestId = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, _subIdCounter)));
        lastRequestId = requestId;
        lastConsumer = msg.sender;
        requestExists[requestId] = true;
        
        return requestId;
    }

    // Funções customizadas para os testes
    function fundSubscription(uint64 subId, uint96 amount) external {
        s_subscriptions[subId].balance += amount;
    }

    function addConsumer(uint64 subId, address consumer) external override {
        // Lógica não necessária para o mock, mas a função precisa existir
    }

    function fulfillRandomWordsWithResult(uint256 _requestId, address _consumer, uint256[] memory _randomWords) external {
        require(requestExists[_requestId], "request not found");
        requestExists[_requestId] = false;
        VRFConsumerBaseV2(_consumer).rawFulfillRandomWords(_requestId, _randomWords);
    }

    // --- Implementação de todas as funções da Interface com 'override' ---

    function getRequestConfig() external view override returns (uint16, uint32, bytes32[] memory) {
        return (3, 100000, new bytes32[](0));
    }

    function getSubscription(uint64 subId) external view override returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers) {
        Subscription memory sub = s_subscriptions[subId];
        return (sub.balance, 0, sub.owner, new address[](0));
    }

    function removeConsumer(uint64 subId, address consumer) external override {}
    function cancelSubscription(uint64 subId, address to) external override {}
    function requestSubscriptionOwnerTransfer(uint64 subId, address newOwner) external override {}
    function acceptSubscriptionOwnerTransfer(uint64 subId) external override {}
    
    function pendingRequestExists(uint64 subId) external view override returns (bool) {
        return false;
    }
    
    function getFeeConfig() external view returns (uint32, uint32, uint32, uint32, uint24, uint24, uint24, uint24) { 
        return (0,0,0,0,0,0,0,0); 
    }
}