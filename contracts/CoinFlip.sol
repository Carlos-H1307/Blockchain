pragma solidity ^0.8.0;

contract CoinFlip {
    address public owner;
    uint256 public betAmount = 0.01 ether;

    event Result(address player, bool win, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function flip(bool guess) public payable {
        require(msg.value == betAmount, "Aposta deve ser de 0.01 ETH");

        // Pseudo-random (não seguro para produção!)
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
}
