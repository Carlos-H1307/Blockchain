// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
//
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

        // Obtem número aleatório do oráculo
        uint256 result = oracle.getRandomNumber() % 2;

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

    receive() external payable {}
}
