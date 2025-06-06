async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const CoinFlip = await ethers.getContractFactory("CoinFlip");
  const coinFlip = await CoinFlip.deploy();

  // Espere o deploy ser minerado
  await coinFlip.waitForDeployment();

  console.log("CoinFlip deployed to:", await coinFlip.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
