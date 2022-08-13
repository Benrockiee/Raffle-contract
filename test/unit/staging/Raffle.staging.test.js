const { assert, expect } = require("chai");
const { network, getNamedAccounts, ethers } = require("hardhat");
const { developmentChains } = require("../../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle Unit Tests", () => {
      let raffle, raffleEntranceFee, deployer;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        raffle = await ethers.getContract("Raffle", deployer);
        raffleEntranceFee = await raffle.getEntranceFee();
      });

      describe("fulfillRandomWords", () => {
        it("should work with Chainlink VRF and Keepers and get the winner picked.", async () => {
          const startingTimeStamp = await raffle.getLatestTimeStamp();
          const accounts = await ethers.getSigners();

          await new Promise(async (resolve, reject) => {
            raffle.once("WinnerPicked", async () => {
              console.log("Winner Picked event fired!");

              try {
                const recentWinner = await raffle.getRecentWinner();
                const raffleState = await raffle.getRaffleState();
                const endingTimeStamp = await raffle.getLastTimeStamp();
                const numPlayers = await raffle.getNumberOfPlayers();
                const winnerEndingBalance = await accounts[0].getBalance();

                // * Comparisons to check if our ending values are correct:
                assert.equal(recentWinner.toString(), accounts[0].address);
                assert.equal(numPlayers.toString(), "0");
                assert.equal(raffleState.toString(), "0");
                expect(endingTimeStamp).to.be.greaterThan(startingTimeStamp);
                // assert.equal(
                //   winnerEndingBalance.toString(),
                //   winnerStartingBalance.add(raffleEntranceFee).toString()
                // );
                resolve();
              } catch (error) {
                console.log(error);
                reject(error);
              }
            });

            const tx = await raffle.enterRaffle({ value: raffleEntranceFee });
            // await tx.wait(1);
            // console.log("Ok, time to wait...");
            // const winnerStartingBalance = await accounts[0].getBalance();
          });
        });
      });
    });
