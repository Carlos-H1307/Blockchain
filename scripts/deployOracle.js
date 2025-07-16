async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const Oracle = await ethers.getContractFactory("OracleVRF");
  const oracle = await Oracle.deploy(
    339647,
    "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
    "0x121477b2d9e75d847e756c0a8188e29ca1d5653eb3bd1dfc4d6c2cd5b3b1b4f2");

  // Espere o deploy ser minerado
  await oracle.waitForDeployment();

  console.log("Oracle deployed to:", await oracle.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
