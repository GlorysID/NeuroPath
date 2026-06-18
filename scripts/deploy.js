const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const Credential = await hre.ethers.getContractFactory("NeuroPathCredential");
  const credential = await Credential.deploy();
  await credential.waitForDeployment();

  const address = await credential.getAddress();
  console.log("NeuroPathCredential deployed to:", address);

  // Save the contract address to a file so the backend API can use it
  fs.writeFileSync(
    "contractAddress.json",
    JSON.stringify({ address: address }, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
