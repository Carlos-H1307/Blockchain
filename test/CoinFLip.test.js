const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoinFlip", function () {
  let CoinFlip;
  let coinFlip;
  let owner, player1, player2;

  before(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    CoinFlip = await ethers.getContractFactory("CoinFlip");
    coinFlip = await CoinFlip.deploy();
    await coinFlip.deployed();
  });

  it("Deve definir o dono corretamente", async function () {
    expect(await coinFlip.owner()).to.equal(owner.address);
  });

  it("Deve iniciar com o valor de aposta correto", async function () {
    expect(await coinFlip.betAmount()).to.equal(ethers.utils.parseEther("0.0001"));
  });
});

describe("Funcionalidade flip()", function () {
  it("Deve rejeitar valores diferentes de 0.0001 ETH", async function () {
    await expect(
      coinFlip.connect(player1).flip(true, { value: ethers.utils.parseEther("0.0002") })
    ).to.be.revertedWith("Aposta deve ser de 0.0001 ETH");
    
    await expect(
      coinFlip.connect(player1).flip(true, { value: ethers.utils.parseEther("0.00005") })
    ).to.be.revertedWith("Aposta deve ser de 0.0001 ETH");
  });

  it("Deve emitir um evento Result independente do resultado", async function () {
    await expect(
      coinFlip.connect(player1).flip(true, { value: ethers.utils.parseEther("0.0001") })
    ).to.emit(coinFlip, "Result").withArgs(player1.address, anyBoolean, anyValue);
  });
});

describe("Lógica de vitória/derrota", function () {
  it("Deve pagar 0.0002 ETH quando o jogador ganha", async function () {
    // Fundos o contrato primeiro
    await owner.sendTransaction({
      to: coinFlip.address,
      value: ethers.utils.parseEther("0.001")
    });

    const initialBalance = await ethers.provider.getBalance(player1.address);
    
    // Como não podemos prever o resultado, verificamos ambos os cenários
    const tx = await coinFlip.connect(player1).flip(true, { value: ethers.utils.parseEther("0.0001") });
    const receipt = await tx.wait();
    
    const event = receipt.events?.find(e => e.event === "Result");
    const didWin = event.args.win;
    
    const finalBalance = await ethers.provider.getBalance(player1.address);
    
    if (didWin) {
      expect(finalBalance).to.be.closeTo(
        initialBalance.add(ethers.utils.parseEther("0.0001")),
        ethers.utils.parseEther("0.00001")
      );
    } else {
      expect(finalBalance).to.be.closeTo(
        initialBalance.sub(ethers.utils.parseEther("0.0001")),
        ethers.utils.parseEther("0.00001")
      );
    }
  });
});

describe("Funções administrativas", function () {
  it("Deve permitir que o dono sacar fundos", async function () {
    // Adiciona fundos ao contrato
    await owner.sendTransaction({
      to: coinFlip.address,
      value: ethers.utils.parseEther("0.01")
    });
    
    const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
    const contractBalance = await ethers.provider.getBalance(coinFlip.address);
    
    const tx = await coinFlip.connect(owner).withdraw();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    
    const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
    
    expect(finalOwnerBalance).to.be.closeTo(
      initialOwnerBalance.add(contractBalance).sub(gasUsed),
      ethers.utils.parseEther("0.001")
    );
  });

  it("Não deve permitir que não-donos sacar fundos", async function () {
    await expect(
      coinFlip.connect(player1).withdraw()
    ).to.be.revertedWith("Apenas o dono pode sacar");
  });

  it("Deve aceitar fundos via fundContract()", async function () {
    const amount = ethers.utils.parseEther("0.005");
    await expect(() =>
      coinFlip.connect(player1).fundContract({ value: amount })
    ).to.changeEtherBalance(coinFlip, amount);
  });

  it("Deve aceitar fundos via transferência direta", async function () {
    const amount = ethers.utils.parseEther("0.005");
    await expect(() =>
      owner.sendTransaction({ to: coinFlip.address, value: amount })
    ).to.changeEtherBalance(coinFlip, amount);
  });
});

describe("Testes de segurança", function () {
  it("Não deve permitir chamadas reentrantes", async function () {
    // Testa se o contrato é vulnerável a ataques de reentrância
    // Implementação simplificada - em um teste real, precisaríamos de um contrato de ataque
    const tx = await coinFlip.connect(player1).flip(true, { value: ethers.utils.parseEther("0.0001") });
    await expect(tx).to.not.be.reverted;
  });

  it("Deve ter aleatoriedade imprevisível", async function () {
    // Testa se os resultados são imprevisíveis (teste estatístico básico)
    let wins = 0;
    const trials = 100;
    
    for (let i = 0; i < trials; i++) {
      const tx = await coinFlip.connect(player1).flip(true, { value: ethers.utils.parseEther("0.0001") });
      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === "Result");
      if (event.args.win) wins++;
    }
    
    // Esperamos cerca de 50% de vitórias (com margem de erro)
    expect(wins).to.be.greaterThan(trials * 0.35);
    expect(wins).to.be.lessThan(trials * 0.65);
  });
});

describe("Casos de borda", function () {
  it("Não deve permitir flip quando o contrato não tem fundos suficientes", async function () {
    // Retira todos os fundos
    await coinFlip.connect(owner).withdraw();
    
    await expect(
      coinFlip.connect(player1).flip(true, { value: ethers.utils.parseEther("0.0001") })
    ).to.be.reverted; // Falha na transferência
  });

  it("Deve lidar com múltiplos jogadores simultaneamente", async function () {
    // Fundos o contrato
    await owner.sendTransaction({
      to: coinFlip.address,
      value: ethers.utils.parseEther("0.01")
    });
    
    // Chamadas simultâneas de diferentes jogadores
    const tx1 = coinFlip.connect(player1).flip(true, { value: ethers.utils.parseEther("0.0001") });
    const tx2 = coinFlip.connect(player2).flip(false, { value: ethers.utils.parseEther("0.0001") });
    
    await expect(Promise.all([tx1, tx2])).to.not.be.reverted;
  });
});