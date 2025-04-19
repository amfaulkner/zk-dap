/**
 * Deployment script for ZK Data Access contracts
 */
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ZK Data Access contracts...");

  // Deploy the Verifier contract first
  const Verifier = await ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  
  console.log(`Verifier deployed to ${await verifier.getAddress()}`);

  // Then deploy the ZKDataAccess contract with the Verifier address
  const ZKDataAccess = await ethers.getContractFactory("ZKDataAccess");
  const zkDataAccess = await ZKDataAccess.deploy(await verifier.getAddress());
  await zkDataAccess.waitForDeployment();
  
  console.log(`ZKDataAccess deployed to ${await zkDataAccess.getAddress()}`);

  // Register a sample resource
  const resourceId = 67890;
  const requiredPermission = 5;
  const resourceData = "This is sensitive data requiring permission level 5";
  
  const tx = await zkDataAccess.registerResource(
    resourceId,
    requiredPermission,
    resourceData
  );
  await tx.wait();
  
  console.log(`Registered resource #${resourceId} with permission level ${requiredPermission}`);
  
  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 