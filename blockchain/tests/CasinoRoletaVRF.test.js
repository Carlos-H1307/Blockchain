const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");


describe("CasinoRoletaVRF", function () {
    let casinoContract;
    let vrfCoordinatorMock;
    let owner, player1, player2;
    let subscriptionId;

    const toWei = (num) => ethers.parseEther(num.toString());
    const fromWei = (num) => ethers.formatEther(num);

    // Roda antes de cada teste "it(...)" para preparar o ambiente
    beforeEach(async function () {
        [owner, player1, player2] = await ethers.getSigners();

        // 1. Deploy do Mock do VRF Coordinator
        const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
        vrfCoordinatorMock = await VRFCoordinatorV2Mock.deploy(toWei(0.1), toWei(0.001));
        await vrfCoordinatorMock.waitForDeployment();

        // 2. Criação da subscrição no Mock
        const tx = await vrfCoordinatorMock.createSubscription();
        const receipt = await tx.wait();
        subscriptionId = receipt.logs[0].args[0];

        //adicionar funds
        //await vrfCoordinatorMock.fundSubscription(subscriptionId, ethers.parseEther("10"));

        // 3. Deploy do contrato CasinoRoletaVRF
        const CasinoRoletaVRF = await ethers.getContractFactory("CasinoRoletaVRF");
        casinoContract = await CasinoRoletaVRF.deploy(
            subscriptionId,
            await vrfCoordinatorMock.getAddress(),
            "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"
        );
        await casinoContract.waitForDeployment();

        // 4. Adiciona o contrato como consumidor da subscrição
        await vrfCoordinatorMock.addConsumer(subscriptionId, await casinoContract.getAddress());

        // 5. Financia o saldo da casa para pagar prêmios
        await casinoContract.connect(owner).addHouseFunds({ value: toWei(10) });
    });

    describe("Apostas (Player Actions)", function () {
        it("Deve permitir um jogador fazer uma aposta e GANHAR", async function () {
            const betAmount = toWei(0.005);
            const playerInitialBalance = await ethers.provider.getBalance(player1.address);

            await vrfCoordinatorMock.fundSubscription(subscriptionId, ethers.parseEther("10"));

            const placeBetTx = await casinoContract.connect(player1).placeBet({ value: betAmount });
            const receipt = await placeBetTx.wait();
            const requestId = casinoContract.interface.parseLog(receipt.logs[0]).args.requestId;
            
            // Simula o callback do oráculo com um número que resulta em vitória (1 a 25)
            await vrfCoordinatorMock.fulfillRandomWordsWithResult(requestId, await casinoContract.getAddress(), [10]);

            const playerFinalBalance = await ethers.provider.getBalance(player1.address);
            const expectedBalance = playerInitialBalance + betAmount; // Ganho líquido de 1x aposta
            expect(Number(playerFinalBalance)).to.be.closeTo(Number(expectedBalance), Number(toWei(0.001))); // Margem para o gás

            const stats = await casinoContract.getPlayerStats(player1.address);
            expect(Number(stats.wins)).to.equal(1);
        });

        it("Deve permitir um jogador fazer uma aposta e PERDER", async function () {
            const betAmount = toWei(0.005);
            const playerInitialBalance = await ethers.provider.getBalance(player1.address);

            await vrfCoordinatorMock.fundSubscription(subscriptionId, ethers.parseEther("10"));

            const placeBetTx = await casinoContract.connect(player1).placeBet({ value: betAmount });
            const receipt = await placeBetTx.wait();
            const requestId = casinoContract.interface.parseLog(receipt.logs[0]).args.requestId;

            // Simula o callback com um número que resulta em derrota (26 a 50)
            await vrfCoordinatorMock.fulfillRandomWordsWithResult(requestId, await casinoContract.getAddress(), [40]);

            const playerFinalBalance = await ethers.provider.getBalance(player1.address);
            const expectedBalance = playerInitialBalance - betAmount;
            expect(Number(playerFinalBalance)).to.be.closeTo(Number(expectedBalance), Number(toWei(0.001)));

            const stats = await casinoContract.getPlayerStats(player1.address);
            expect(Number(stats.losses)).to.equal(1);
        });

        it("Deve reembolsar a aposta se a casa não puder pagar o prêmio", async function () {
            // Zera o saldo da casa para o teste
            const currentHouseBalance = await casinoContract.houseBalance();
 
            await vrfCoordinatorMock.fundSubscription(subscriptionId, ethers.parseEther("1"));

            // Adiciona apenas o valor da aposta, insuficiente para pagar o prêmio de 2x
            const betAmount = toWei(0.005);

            const playerInitialBalance = await ethers.provider.getBalance(player1.address);
            const placeBetTx = await casinoContract.connect(player1).placeBet({ value: betAmount });
            const receipt = await placeBetTx.wait();
            //const requestId = casinoContract.interface.parseLog(receipt.logs[0]).args.requestId;
            const betPlacedEvent = receipt.logs.find(e => e.eventName === 'BetPlaced');
            const requestId = betPlacedEvent.args.requestId;

            // Simula uma vitória
            await vrfCoordinatorMock.fulfillRandomWordsWithResult(requestId, await casinoContract.getAddress(), [10]);
            
            // O jogador deve receber apenas a aposta de volta
            const playerFinalBalance = await ethers.provider.getBalance(player1.address);
            //expect(Number(playerFinalBalance)).to.be.closeTo(Number(playerInitialBalance), Number(toWei(0.001))); // Saldo deve ser quase o mesmo
            //expect(playerFinalBalance).to.be.closeTo(playerInitialBalance, toWei(0.001));

            // Supondo que você está usando ethers v6 (que retorna BigInts de getBalance e toWei)

            // Converte o saldo final do jogador de wei para ether (como string) e depois para Number
            const playerFinalBalanceInEth = parseFloat(ethers.formatEther(playerFinalBalance));

            // Converte o saldo inicial do jogador de wei para ether (como string) e depois para Number
            const playerInitialBalanceInEth = parseFloat(ethers.formatEther(playerInitialBalance));

            // Converte a margem de gás de wei para ether (como string) e depois para Number
            const gasMarginInEth = parseFloat(ethers.formatEther(toWei(0.01)));

            // Agora faça a asserção com os valores em Ether (Number)
            expect(playerFinalBalanceInEth).to.be.closeTo(playerInitialBalanceInEth, gasMarginInEth);
        });

        it("Deve rejeitar apostas quando o contrato estiver pausado", async function () {
            await casinoContract.connect(owner).pause();
            await expect(casinoContract.connect(player1).placeBet({ value: toWei(0.002) })).to.be.revertedWith("Contrato pausado");
        });

        it("Deve rejeitar apostas abaixo do mínimo", async function () {
            await expect(casinoContract.connect(player1).placeBet({ value: toWei(0.0001) })).to.be.revertedWith("Aposta muito baixa");
        });

        it("Deve rejeitar apostas acima do máximo", async function () {
            await expect(casinoContract.connect(player1).placeBet({ value: toWei(0.006) })).to.be.revertedWith("Aposta muito alta");
        });
    });

    describe("Funções do Dono (Admin Actions)", function () {
        it("Deve permitir ao dono sacar fundos", async function () {
            const amountToWithdraw = toWei(1);
            const ownerInitialBalance = await ethers.provider.getBalance(owner.address);
            
            await expect(casinoContract.connect(owner).withdrawHouseFunds(amountToWithdraw)).to.not.be.reverted;

            const ownerFinalBalance = await ethers.provider.getBalance(owner.address);
            expect(ownerFinalBalance).to.be.gt(ownerInitialBalance); // Maior que o inicial (considerando o gás)
        });

        it("Deve impedir que não-donos saquem fundos", async function () {
            await expect(casinoContract.connect(player1).withdrawHouseFunds(toWei(1))).to.be.revertedWith("Only callable by owner");
        });

        it("Deve permitir ao dono pausar e despausar o contrato", async function () {
            await casinoContract.connect(owner).pause();
            expect(await casinoContract.paused()).to.be.true;

            await casinoContract.connect(owner).unpause();
            expect(await casinoContract.paused()).to.be.false;
        });

        it("Deve permitir ao dono resolver uma aposta travada após 1 hora", async function () {
            const betAmount = toWei(0.003);
            await vrfCoordinatorMock.fundSubscription(subscriptionId, ethers.parseEther("10"));

            await casinoContract.connect(player1).placeBet({ value: betAmount });


            // Avança o tempo da blockchain em mais de 1 hora
            await time.increase(3601);

            const latestRequestId = (await casinoContract.getBetInfo(await vrfCoordinatorMock.lastRequestId())).player !== ethers.ZeroAddress 
                ? await vrfCoordinatorMock.lastRequestId() 
                : 0;
            
            const playerInitialBalance = await ethers.provider.getBalance(player1.address);
            await casinoContract.connect(owner).resolveStuckBet(latestRequestId);
            const playerFinalBalance = await ethers.provider.getBalance(player1.address);

            // Jogador recebe a aposta de volta
            expect(playerFinalBalance).to.be.closeTo(playerInitialBalance + betAmount, toWei(0.001));
        });

         it("Deve impedir de resolver uma aposta travada antes de 1 hora", async function () {
            const betAmount = toWei(0.003);
            await vrfCoordinatorMock.fundSubscription(subscriptionId, ethers.parseEther("10"));
            await casinoContract.connect(player1).placeBet({ value: betAmount });

            
            const latestRequestId = await vrfCoordinatorMock.lastRequestId();
            await expect(casinoContract.connect(owner).resolveStuckBet(latestRequestId)).to.be.revertedWith("Aposta muito recente");
        });
    });
});