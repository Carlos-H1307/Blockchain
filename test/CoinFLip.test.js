const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoinFlip", function () {
    let coinFlip;
    let vrfCoordinatorMock;
    let owner;
    let player1;
    let player2;
    let nonOwner;

    // Chainlink VRF V2 specific values
    let subscriptionId;
    const FUND_AMOUNT = ethers.utils.parseEther("10"); // 10 LINK para financiar a subscrição
    const BET_AMOUNT = ethers.utils.parseEther("0.0001");
    const KEY_HASH = "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15";
    const BASE_FEE = ethers.utils.parseUnits("0.25", "gwei"); // 0.25 gwei
    const GAS_PRICE_LINK = ethers.utils.parseUnits("1", "gwei"); // 1 gwei

    beforeEach(async function () {
        [owner, player1, player2, nonOwner] = await ethers.getSigners();

        // 1. Deploy VRFCoordinatorV2Mock
        const VRFCoordinatorV2MockFactory = await ethers.getContractFactory("VRFCoordinatorV2Mock");
        vrfCoordinatorMock = await VRFCoordinatorV2MockFactory.deploy(
            BASE_FEE,
            GAS_PRICE_LINK
        );

        // 2. Create and fund subscription
        const createSubTx = await vrfCoordinatorMock.createSubscription();
        const createSubReceipt = await createSubTx.wait();
        
        // Extract subscription ID from events
        const subscriptionCreatedEvent = createSubReceipt.logs.find(
            log => {
                try {
                    const parsed = vrfCoordinatorMock.interface.parseLog(log);
                    return parsed.name === 'SubscriptionCreated';
                } catch {
                    return false;
                }
            }
        );
        
        // Ensure subscriptionCreatedEvent is not undefined before accessing its properties
        subscriptionId = subscriptionCreatedEvent ? 
            vrfCoordinatorMock.interface.parseLog(subscriptionCreatedEvent).args.subId : 1n;
        
        // Fund the subscription
        await vrfCoordinatorMock.fundSubscription(subscriptionId, FUND_AMOUNT);

        // 3. Deploy CoinFlip contract
        const CoinFlipFactory = await ethers.getContractFactory("CoinFlip");
        coinFlip = await CoinFlipFactory.deploy(
            vrfCoordinatorMock.address,
            subscriptionId,
            KEY_HASH
        );

        // Send initial ETH to the CoinFlip contract for testing
        await owner.sendTransaction({
            to: coinFlip.address,
            value: ethers.utils.parseEther("1") // 1 ETH
        });

        // 4. Add CoinFlip as consumer to VRFCoordinatorMock
        await vrfCoordinatorMock.addConsumer(subscriptionId, coinFlip.address);
    });

    // Helper function to extract request ID from transaction
    async function getRequestIdFromTx(tx) {
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => {
            try {
                const parsed = coinFlip.interface.parseLog(log);
                return parsed.name === 'FlipRequested';
            } catch {
                return false;
            }
        });
        // Convert to string for consistent comparison if needed later, or return as BigInt
        return coinFlip.interface.parseLog(event).args.requestId;
    }

    describe("Deployment", function () {
        it("Should set the correct VRF coordinator", async function () {
            // Assuming your contract has a getter for VRF coordinator address
            expect(await coinFlip.getVrfCoordinator()).to.equal(vrfCoordinatorMock.address);
        });

        it("Should set the correct bet amount", async function () {
            // Assuming your contract has a getter for the bet amount
            expect((await coinFlip.getBetAmount()).toString()).to.equal(BET_AMOUNT.toString());
        });

        it("Should set the correct owner", async function () {
            // Assuming your contract has an owner getter or similar
            expect(await coinFlip.owner()).to.equal(owner.address);
        });
    });

    describe("flip() function", function () {

        it("Should store pending request correctly", async function () {
            const tx = await coinFlip.connect(player1).flip(false, { value: BET_AMOUNT });
            const requestId = await getRequestIdFromTx(tx);
            
            expect(await coinFlip.s_pendingRequests(requestId)).to.equal(player1.address);
            expect(await coinFlip.s_playerGuess(requestId)).to.equal(false);
        });

        it("Should revert if bet amount is too low", async function () {
            await expect(
                coinFlip.connect(player1).flip(true, { value: BET_AMOUNT.sub(1) })
            ).to.be.revertedWith("Aposta deve ser de 0.0001 ETH");
        });

        it("Should revert if bet amount is too high", async function () {
            await expect(
                coinFlip.connect(player1).flip(true, { value: BET_AMOUNT.add(1) })
            ).to.be.revertedWith("Aposta deve ser de 0.0001 ETH");
        });

        it("Should revert with zero value", async function () {
            await expect(
                coinFlip.connect(player1).flip(true, { value: 0 })
            ).to.be.revertedWith("Aposta deve ser de 0.0001 ETH");
        });

        it("Should handle both true (heads) and false (tails) guesses", async function () {
            const tx1 = await coinFlip.connect(player1).flip(true, { value: BET_AMOUNT });
            const tx2 = await coinFlip.connect(player2).flip(false, { value: BET_AMOUNT });
            
            const requestId1 = await getRequestIdFromTx(tx1);
            const requestId2 = await getRequestIdFromTx(tx2);
            
            expect(await coinFlip.s_playerGuess(requestId1)).to.equal(true);
            expect(await coinFlip.s_playerGuess(requestId2)).to.equal(false);
        });
    });

    describe("fulfillRandomWords() - Player Wins", function () {
        let requestId;
        let playerBalanceBefore;

        beforeEach(async function () {
            // Make a bet for heads
            const tx = await coinFlip.connect(player1).flip(true, { value: BET_AMOUNT });
            requestId = await getRequestIdFromTx(tx);
            // Get balance after placing the bet (ETH is sent from player to contract)
            playerBalanceBefore = await ethers.provider.getBalance(player1.address);
        });

        it("Should pay winner when guess is correct (heads)", async function () {
            const contractBalanceBefore = await ethers.provider.getBalance(coinFlip.address);
            
            // Simulate VRF callback with result = 1 (heads)
            await vrfCoordinatorMock.fulfillRandomWordsWithResult(
                requestId,
                coinFlip.address,
                [1] // heads
            );
            
            // Query for the Result event
            const resultFilter = coinFlip.filters.Result();
            const events = await coinFlip.queryFilter(resultFilter);
            // Find the event related to the current requestId
            const targetEvent = events.find(e => e.args.requestId.toString() === requestId.toString());
            
            expect(targetEvent.args.requestId.toString()).to.equal(requestId.toString());
            expect(targetEvent.args.player).to.equal(player1.address);
            expect(targetEvent.args.win).to.equal(true);
            expect(targetEvent.args.amount.toString()).to.equal(BET_AMOUNT.mul(2).toString());
            
            // Player should receive 2x bet amount (initial bet + winnings)
            const playerBalanceAfter = await ethers.provider.getBalance(player1.address);
            // We need to account for gas costs if comparing exact balances after a transaction that consumes gas
            // For simplicity in this test, we verify the increase relative to the bet.
            // A more robust test would calculate the gas cost of the fulfillRandomWords transaction if player was involved in it,
            // but here player's balance changes only due to transfer from contract.
            const expectedBalanceAfterWin = playerBalanceBefore.add(BET_AMOUNT.mul(2));
            expect(playerBalanceAfter.toString()).to.equal(expectedBalanceAfterWin.toString());

            // Contract balance should decrease by 2x bet amount (it pays out the win)
            const contractBalanceAfter = await ethers.provider.getBalance(coinFlip.address);
            const expectedContractBalance = contractBalanceBefore.sub(BET_AMOUNT.mul(2));
            expect(contractBalanceAfter.toString()).to.equal(expectedContractBalance.toString());
            
            // Request data should be cleared
            expect(await coinFlip.s_pendingRequests(requestId)).to.equal(ethers.constants.AddressZero);
            expect(await coinFlip.s_playerGuess(requestId)).to.equal(false);
        });

        it("Should pay winner when guess is correct (tails)", async function () {
            // Make a new bet for tails
            const tx = await coinFlip.connect(player2).flip(false, { value: BET_AMOUNT });
            const tailsRequestId = await getRequestIdFromTx(tx);
            const player2BalanceBefore = await ethers.provider.getBalance(player2.address);
            
            // Simulate VRF callback with result = 0 (tails)
            await vrfCoordinatorMock.fulfillRandomWordsWithResult(
                tailsRequestId,
                coinFlip.address,
                [0] // tails
            );
            
            // Query for the Result event
            const resultFilter = coinFlip.filters.Result();
            const events = await coinFlip.queryFilter(resultFilter);
            const targetEvent = events.find(e => e.args.requestId.toString() === tailsRequestId.toString());
            
            expect(targetEvent.args.requestId.toString()).to.equal(tailsRequestId.toString());
            expect(targetEvent.args.player).to.equal(player2.address);
            expect(targetEvent.args.win).to.equal(true);
            expect(targetEvent.args.amount.toString()).to.equal(BET_AMOUNT.mul(2).toString());
            
            // Player should receive 2x bet amount
            const player2BalanceAfter = await ethers.provider.getBalance(player2.address);
            const expectedBalance = player2BalanceBefore.add(BET_AMOUNT.mul(2));
            expect(player2BalanceAfter.toString()).to.equal(expectedBalance.toString());
        });

        it("Should handle large random numbers correctly", async function () {
            // Test with a very large random number (should still work with modulo)
            const largeRandomNumber = ethers.BigNumber.from("12345678901234567890123456789");
            
            await vrfCoordinatorMock.fulfillRandomWordsWithResult(
                requestId,
                coinFlip.address,
                [largeRandomNumber]
            );
            
            // Check that Result event was emitted (regardless of win/loss for this test)
            const resultFilter = coinFlip.filters.Result();
            const events = await coinFlip.queryFilter(resultFilter);
            const targetEvent = events.find(e => e.args.requestId.toString() === requestId.toString());
            expect(targetEvent).to.not.be.undefined;
            expect(targetEvent.args.requestId.toString()).to.equal(requestId.toString());
        });
    });

    describe("fulfillRandomWords() - Player Loses", function () {
        let requestId;
        let playerBalanceBeforeBet; // Balance before sending the bet
        let contractBalanceBefore;

        beforeEach(async function () {
            // Get player's balance before placing the bet
            playerBalanceBeforeBet = await ethers.provider.getBalance(player1.address);
            // Make a bet for heads
            const tx = await coinFlip.connect(player1).flip(true, { value: BET_AMOUNT });
            requestId = await getRequestIdFromTx(tx);
            contractBalanceBefore = await ethers.provider.getBalance(coinFlip.address);
        });

        it("Should retain bet when player loses", async function () {
            // Simulate VRF callback with result = 0 (tails) when player guessed heads
            await vrfCoordinatorMock.fulfillRandomWordsWithResult(
                requestId,
                coinFlip.address,
                [0] // tails
            );
            
            // Query for the Result event
            const resultFilter = coinFlip.filters.Result();
            const events = await coinFlip.queryFilter(resultFilter);
            const targetEvent = events.find(e => e.args.requestId.toString() === requestId.toString());
            
            expect(targetEvent.args.requestId.toString()).to.equal(requestId.toString());
            expect(targetEvent.args.player).to.equal(player1.address);
            expect(targetEvent.args.win).to.equal(false);
            expect(targetEvent.args.amount.toString()).to.equal("0"); // Amount won should be 0
            
            // Player balance should reflect the initial bet being subtracted (loss)
            const playerBalanceAfter = await ethers.provider.getBalance(player1.address);
            // The player's balance after losing should be their balance before the bet minus the gas cost of the initial `flip` transaction.
            // Since we're not precisely tracking gas cost for `flip` here, we'll assert that the contract balance increased correctly.
            // For a more exact player balance check, you'd need to measure gas cost of the `flip` tx.
            // A simple check is that their balance is less than before the bet.
            expect(playerBalanceAfter.lt(playerBalanceBeforeBet)).to.be.true;

            // Contract should retain the bet amount
            const contractBalanceAfter = await ethers.provider.getBalance(coinFlip.address);
            expect(contractBalanceAfter.toString()).to.equal(contractBalanceBefore.toString());
            
            // Request data should be cleared
            expect(await coinFlip.s_pendingRequests(requestId)).to.equal(ethers.constants.AddressZero);
            expect(await coinFlip.s_playerGuess(requestId)).to.equal(false);
        });

        it("Should handle consecutive losses correctly", async function () {
            // Player loses first bet
            await vrfCoordinatorMock.fulfillRandomWordsWithResult(
                requestId,
                coinFlip.address,
                [0] // tails, player guessed heads
            );
            
            // Make another bet
            const tx2 = await coinFlip.connect(player1).flip(true, { value: BET_AMOUNT });
            const requestId2 = await getRequestIdFromTx(tx2);
            
            // Player loses second bet
            await vrfCoordinatorMock.fulfillRandomWordsWithResult(
                requestId2,
                coinFlip.address,
                [0] // tails again
            );
            
            // Query for the Result event for the second request
            const resultFilter = coinFlip.filters.Result();
            const events = await coinFlip.queryFilter(resultFilter);
            const targetEvent = events.find(e => e.args.requestId.toString() === requestId2.toString());
            
            expect(targetEvent.args.requestId.toString()).to.equal(requestId2.toString());
            expect(targetEvent.args.player).to.equal(player1.address);
            expect(targetEvent.args.win).to.equal(false);
            expect(targetEvent.args.amount.toString()).to.equal("0");
            
            // Contract should have initial funding (1 ETH) + two losing bets
            const contractBalance = await ethers.provider.getBalance(coinFlip.address);
            const expectedBalance = ethers.utils.parseEther("1").add(BET_AMOUNT.mul(2));
            expect(contractBalance.toString()).to.equal(expectedBalance.toString());
        });
    });

    describe("fulfillRandomWords() - Error Cases", function () {
        it("Should revert for non-existent request when called directly", async function () {
            const nonExistentRequestId = 999;
            
            // The mock VRF coordinator should revert if the request doesn't exist
            await expect(
                vrfCoordinatorMock.fulfillRandomWordsWithResult(
                    nonExistentRequestId,
                    coinFlip.address,
                    [1]
                )
            ).to.be.revertedWith("request not found");
        });

        it("Should handle empty random words array", async function () {
            const tx = await coinFlip.connect(player1).flip(true, { value: BET_AMOUNT });
            const requestId = await getRequestIdFromTx(tx);
            
            // This expects the VRFCoordinatorMock to revert if the randomWords array is empty.
            // The `fulfillRandomWords` function in `VRFCoordinatorV2Mock` usually expects at least one random word.
            await expect(
                vrfCoordinatorMock.fulfillRandomWordsWithResult(
                    requestId,
                    coinFlip.address,
                    [] // empty array
                )
            ).to.be.reverted; // Expecting a revert without a specific message as it might vary
        });
    });

    describe("withdraw() function", function () {
        beforeEach(async function () {
            // Add some funds to contract by having players lose bets
            const tx1 = await coinFlip.connect(player1).flip(true, { value: BET_AMOUNT });
            const tx2 = await coinFlip.connect(player2).flip(true, { value: BET_AMOUNT });
            
            const requestId1 = await getRequestIdFromTx(tx1);
            const requestId2 = await getRequestIdFromTx(tx2);
            
            // Simulate both players losing (result = 0, but they guessed heads)
            await vrfCoordinatorMock.fulfillRandomWordsWithResult(requestId1, coinFlip.address, [0]);
            await vrfCoordinatorMock.fulfillRandomWordsWithResult(requestId2, coinFlip.address, [0]);
        });

        it("Should allow owner to withdraw funds", async function () {
            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
            const contractBalance = await ethers.provider.getBalance(coinFlip.address);
            
            // Contract should have initial funding (1 ETH) + two losing bets
            const expectedContractBalanceBeforeWithdraw = ethers.utils.parseEther("1").add(BET_AMOUNT.mul(2));
            expect(contractBalance.toString()).to.equal(expectedContractBalanceBeforeWithdraw.toString());
            
            const tx = await coinFlip.connect(owner).withdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice || tx.gasPrice);
            
            // Contract balance should be zero after withdrawal
            const contractBalanceAfter = await ethers.provider.getBalance(coinFlip.address);
            expect(contractBalanceAfter.toString()).to.equal("0");
            
            // Owner should receive contract balance minus gas cost of the withdraw transaction
            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
            const expectedOwnerBalanceAfterWithdraw = ownerBalanceBefore.add(contractBalance).sub(gasUsed);
            expect(ownerBalanceAfter.toString()).to.equal(expectedOwnerBalanceAfterWithdraw.toString());
        });

        it("Should revert when non-owner tries to withdraw", async function () {
            await expect(
                coinFlip.connect(nonOwner).withdraw()
            ).to.be.revertedWith("Apenas o dono pode sacar"); // Ensure the revert message matches your contract
        });

        it("Should handle withdrawal when contract has no funds", async function () {
            // First, withdraw all funds
            await coinFlip.connect(owner).withdraw();
            
            // Try to withdraw again when contract is empty
            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
            const tx = await coinFlip.connect(owner).withdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice || tx.gasPrice);
            
            // Owner balance should only decrease by gas cost for this second transaction (as no funds are transferred)
            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
            const expectedBalance = ownerBalanceBefore.sub(gasUsed);
            expect(ownerBalanceAfter.toString()).to.equal(expectedBalance.toString());
        });
    });
});