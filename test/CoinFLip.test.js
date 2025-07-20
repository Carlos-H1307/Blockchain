const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoinFlip", function () {
    let coinFlip;
    let vrfCoordinatorMock;
    let owner;
    let player;

    // Chainlink VRF V2 specific values
    let s_subscriptionId;
    const S_FUND_AMOUNT = ethers.parseEther("1"); // 1 ETH para financiar a subscrição
    const BET_AMOUNT = ethers.parseEther("0.0001");
    const S_KEY_HASH = "0x47402dc5d9435b6c934f0d3bf4940cfd808e67a57a0980c53a77611a705e4666"; // Exemplo de keyHash

    beforeEach(async function () {
        [owner, player] = await ethers.getSigners();

        // 1. Deploy VRFCoordinatorV2Mock
        const VRFCoordinatorV2MockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
        vrfCoordinatorMock = await VRFCoordinatorV2MockFactory.deploy(0, 0); // baseFee, gasPriceLink

        // 2. Create a subscription
        const createSubscriptionTx = await vrfCoordinatorMock.createSubscription();
        const createSubscriptionReceipt = await createSubscriptionTx.wait();
        // O ID da subscrição é emitido no evento SubscriptionCreated
        s_subscriptionId = createSubscriptionReceipt.events[0].args.subId;
        
        // 3. Fund the subscription
        await vrfCoordinatorMock.fundSubscription(s_subscriptionId, S_FUND_AMOUNT);

        // 4. Deploy CoinFlip contract
        const CoinFlipFactory = await ethers.getContractFactory("CoinFlip");
        coinFlip = await CoinFlipFactory.deploy(vrfCoordinatorMock.address, s_subscriptionId, S_KEY_HASH);
        await coinFlip.deployed();

        // 5. Add CoinFlip contract as a consumer to the subscription
        await vrfCoordinatorMock.addConsumer(s_subscriptionId, coinFlip.address);
    });

    // --- Testes ---

    describe("Constructor", function () {
        it("Deve definir o coordenador VRF e o valor da aposta corretamente", async function () {
            expect(await coinFlip.getVrfCoordinator()).to.equal(vrfCoordinatorMock.address);
            expect(await coinFlip.getBetAmount()).to.equal(BET_AMOUNT);
        });
    });

    describe("flip()", function () {
        it("Deve permitir que um jogador aposte com o valor correto", async function () {
            const initialContractBalance = await ethers.provider.getBalance(coinFlip.address);
            
            await expect(coinFlip.connect(player).flip(true, { value: BET_AMOUNT }))
                .to.emit(coinFlip, "FlipRequested")
                .withArgs(ethers.BigNumber.from(1), player.address, true); // requestId geralmente começa em 1 para o mock
            
            // Verifica se o contrato recebeu o ETH
            expect(await ethers.provider.getBalance(coinFlip.address)).to.equal(initialContractBalance.add(BET_AMOUNT));
            
            // Verifica o estado da aposta pendente
            expect(await coinFlip.s_pendingRequests(1)).to.equal(player.address);
            expect(await coinFlip.s_playerGuess(1)).to.be.true;
        });

        it("Deve reverter se o valor da aposta for muito baixo", async function () {
            await expect(coinFlip.connect(player).flip(true, { value: BET_AMOUNT.div(2) }))
                .to.be.revertedWith("Aposta deve ser de 0.0001 ETH");
        });

        it("Deve reverter se o valor da aposta for muito alto", async function () {
            await expect(coinFlip.connect(player).flip(true, { value: BET_AMOUNT.mul(2) }))
                .to.be.revertedWith("Aposta deve ser de 0.0001 ETH");
        });
    });

    describe("fulfillRandomWords()", function () {
        it("Deve processar a vitória do jogador e transferir o prêmio", async function () {
            // Fazer a aposta
            const flipTx = await coinFlip.connect(player).flip(true, { value: BET_AMOUNT });
            const flipReceipt = await flipTx.wait();
            const requestId = flipReceipt.events[0].args.requestId;

            const playerBalanceBefore = await ethers.provider.getBalance(player.address);
            const contractBalanceBefore = await ethers.provider.getBalance(coinFlip.address);

            // Simular o callback do VRFCoordinatorMock para o jogador ganhar (aposta 'cara', resultado 'cara')
            // randomWords[0] % 2 = 1 (cara)
            await expect(vrfCoordinatorMock.fulfillRandomWords(requestId, coinFlip.address, [1]))
                .to.emit(coinFlip, "Result")
                .withArgs(requestId, player.address, true, BET_AMOUNT.mul(2));
            
            // Verificar saldos após a vitória
            // O jogador recebe o dobro da aposta, mas já enviou BET_AMOUNT inicialmente.
            // Então o ganho líquido é BET_AMOUNT.
            expect(await ethers.provider.getBalance(player.address)).to.be.closeTo(playerBalanceBefore.add(BET_AMOUNT), ethers.parseEther("0.0000000000000001")); // Pequena variação devido ao gas
            expect(await ethers.provider.getBalance(coinFlip.address)).to.equal(contractBalanceBefore.sub(BET_AMOUNT));

            // Verificar se os dados da requisição foram limpos
            expect(await coinFlip.s_pendingRequests(requestId)).to.equal(ethers.constants.AddressZero);
            expect(await coinFlip.s_playerGuess(requestId)).to.be.false; // bools resetados para false
        });

        it("Deve processar a derrota do jogador e reter a aposta", async function () {
            // Fazer a aposta
            const flipTx = await coinFlip.connect(player).flip(true, { value: BET_AMOUNT });
            const flipReceipt = await flipTx.wait();
            const requestId = flipReceipt.events[0].args.requestId;

            const playerBalanceBefore = await ethers.provider.getBalance(player.address);
            const contractBalanceBefore = await ethers.provider.getBalance(coinFlip.address);

            // Simular o callback do VRFCoordinatorMock para o jogador perder (aposta 'cara', resultado 'coroa')
            // randomWords[0] % 2 = 0 (coroa)
            await expect(vrfCoordinatorMock.fulfillRandomWords(requestId, coinFlip.address, [0]))
                .to.emit(coinFlip, "Result")
                .withArgs(requestId, player.address, false, 0);

            // Verificar saldos após a derrota
            expect(await ethers.provider.getBalance(player.address)).to.equal(playerBalanceBefore); // Saldo não muda
            expect(await ethers.provider.getBalance(coinFlip.address)).to.equal(contractBalanceBefore); // Contrato retém a aposta

            // Verificar se os dados da requisição foram limpos
            expect(await coinFlip.s_pendingRequests(requestId)).to.equal(ethers.constants.AddressZero);
            expect(await coinFlip.s_playerGuess(requestId)).to.be.false;
        });

        it("Deve reverter se a requisição não for encontrada", async function () {
            const nonExistentRequestId = 999;
            await expect(vrfCoordinatorMock.fulfillRandomWords(nonExistentRequestId, coinFlip.address, [1]))
                .to.be.revertedWithCustomError(coinFlip, "CoinFlip__RequestNotFound");
        });
    });

    describe("withdraw()", function () {
        it("Deve permitir que o dono saque os fundos do contrato", async function () {
            // Enviar fundos para o contrato para simular ganhos
            await owner.sendTransaction({ to: coinFlip.address, value: ethers.parseEther("0.5") });

            const ownerBalanceBefore = await owner.getBalance();
            const contractBalance = await ethers.provider.getBalance(coinFlip.address);

            const withdrawTx = await coinFlip.connect(owner).withdraw();
            const withdrawReceipt = await withdrawTx.wait();
            const gasUsed = withdrawReceipt.gasUsed.mul(withdrawReceipt.effectiveGasPrice);

            expect(await ethers.provider.getBalance(coinFlip.address)).to.equal(0);
            expect(await owner.getBalance()).to.equal(ownerBalanceBefore.add(contractBalance).sub(gasUsed));
        });

        it("Deve reverter se um não-dono tentar sacar fundos", async function () {
            await expect(coinFlip.connect(player).withdraw()).to.be.revertedWith("Apenas o dono pode sacar");
        });
    });
});