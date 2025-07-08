// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOracle {
    function getRandomNumber() external view returns (uint256);
}

contract CoinFlip {
    IOracle public oracle;
    address public owner;
    uint256 public betAmount = 0.0001 ether;

    event Result(address player, bool win, uint256 amount);

    constructor(address _oracle) {
        oracle = IOracle(_oracle);
        owner = msg.sender;

    }

    function flip(bool guess) public payable {
        require(msg.value == betAmount, "Aposta deve ser de 0.0001 ETH");

        uint256 result = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % 2;

        bool didWin = (guess == (result == 1));
        if (didWin) {
            payable(msg.sender).transfer(betAmount * 2);
        }

        emit Result(msg.sender, didWin, didWin ? betAmount * 2 : 0);
    }

    function fundContract() public payable {}

    function withdraw() public {
        require(msg.sender == owner, "Apenas o dono pode sacar");
        payable(owner).transfer(address(this).balance);
    }

    // ✅ Adiciona para aceitar ETH diretamente
    receive() external payable {}
}


// Contrato simplificado para testes
pragma solidity ^0.8.0;



contract SimpleRandomFlip {
    
    address public owner;
    
    constructor(address _oracle) {
        oracle = IOracle(_oracle);
        owner = msg.sender;
    }

    function flip(bool guess) public payable {
        require(msg.value == 0.0001 ether, "Valor incorreto");
        
        uint256 randomNumber = oracle.getRandomNumber() % 2;
        bool didWin = (randomNumber == 1);
        
        if (didWin) {
            payable(msg.sender).transfer(0.0002 ether);
        }
    }
}