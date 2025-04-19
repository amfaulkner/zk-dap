/**
 * ZK Data Access Proof - Full Workflow Demo
 * 
 * This script demonstrates the complete workflow for the Zero-Knowledge Data Access Proof system:
 * 1. Generate witness from input
 * 2. Create zero-knowledge proof
 * 3. Verify the proof
 * 4. Show on-chain verification steps
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration
const CIRCUIT_NAME = 'data_access';
const BUILD_DIR = path.join(__dirname, '../circuits/build');
const INPUT_FILE = path.join(BUILD_DIR, 'input.json');
const WASM_FILE = path.join(BUILD_DIR, `${CIRCUIT_NAME}_js`, `${CIRCUIT_NAME}.wasm`);

// Print banner
console.log(chalk.blue.bold('\n===== ZK Data Access Proof - Demo Workflow =====\n'));

// Check if circuit has been compiled
if (!fs.existsSync(WASM_FILE)) {
  console.log(chalk.yellow('Circuit needs to be compiled first.'));
  console.log(chalk.yellow('Running compile-circuit.js...\n'));
  
  try {
    execSync('node scripts/compile-circuit.js', { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red('Failed to compile circuit. Please run scripts/compile-circuit.js first.'));
    process.exit(1);
  }
}

// Read input data
console.log(chalk.cyan('\nDemo Scenario:'));
try {
  const inputData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  console.log(chalk.white('• User has permission level:'), chalk.yellow(inputData.userPermission), chalk.gray('(PRIVATE - not revealed)'));
  console.log(chalk.white('• Resource requires permission level:'), chalk.yellow(inputData.requiredPermission));
  console.log(chalk.white('• Resource ID:'), chalk.yellow(inputData.resourceId));
  console.log(chalk.white('• Goal: Prove user has sufficient permission WITHOUT revealing their actual level'));
} catch (error) {
  console.error(chalk.red(`Failed to read input file: ${error.message}`));
  process.exit(1);
}

// Step 1: Generate witness
console.log(chalk.cyan('\n[1] Generating witness...'));
try {
  execSync(
    `npx snarkjs wtns calculate ${WASM_FILE} ${INPUT_FILE} ${path.join(BUILD_DIR, 'witness.wtns')}`,
    { stdio: 'inherit' }
  );
  console.log(chalk.green('✓ Witness generated successfully'));
} catch (error) {
  console.error(chalk.red(`Failed to generate witness: ${error.message}`));
  process.exit(1);
}

// Step 2: Generate proof
console.log(chalk.cyan('\n[2] Generating zero-knowledge proof...'));
try {
  execSync(
    `npx snarkjs groth16 prove ${path.join(BUILD_DIR, CIRCUIT_NAME + '_final.zkey')} ${path.join(BUILD_DIR, 'witness.wtns')} ${path.join(BUILD_DIR, 'proof.json')} ${path.join(BUILD_DIR, 'public.json')}`,
    { stdio: 'inherit' }
  );
  console.log(chalk.green('✓ Proof generated successfully'));
  
  // Display the proof (truncated)
  const proof = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'proof.json'), 'utf8'));
  console.log(chalk.gray('\nProof (truncated):'));
  console.log(chalk.gray(JSON.stringify({
    pi_a: [proof.pi_a[0].substring(0, 20) + '...', proof.pi_a[1].substring(0, 20) + '...', proof.pi_a[2].substring(0, 20) + '...'],
    pi_b: [[proof.pi_b[0][0].substring(0, 20) + '...', proof.pi_b[0][1].substring(0, 20) + '...'], 'etc...'],
    pi_c: [proof.pi_c[0].substring(0, 20) + '...', 'etc...']
  }, null, 2)));
  
  // Display public signals
  const publicSignals = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, 'public.json'), 'utf8'));
  console.log(chalk.gray('\nPublic Signals:'));
  console.log(chalk.gray(JSON.stringify(publicSignals, null, 2)));
  
} catch (error) {
  console.error(chalk.red(`Failed to generate proof: ${error.message}`));
  process.exit(1);
}

// Step 3: Verify the proof
console.log(chalk.cyan('\n[3] Verifying the proof...'));
try {
  const output = execSync(
    `npx snarkjs groth16 verify ${path.join(BUILD_DIR, 'verification_key.json')} ${path.join(BUILD_DIR, 'public.json')} ${path.join(BUILD_DIR, 'proof.json')}`,
    { encoding: 'utf8' }
  );
  
  if (output.includes('OK')) {
    console.log(chalk.green('✓ Verification SUCCESSFUL! The proof is valid.'));
  } else {
    console.log(chalk.red('✗ Verification FAILED! The proof is invalid.'));
  }
} catch (error) {
  console.error(chalk.red(`Verification failed: ${error.message}`));
  process.exit(1);
}

// Step 4: Generate call data for on-chain verification
console.log(chalk.cyan('\n[4] Generating calldata for on-chain verification...'));
try {
  const calldata = execSync(
    `npx snarkjs zkey export soliditycalldata ${path.join(BUILD_DIR, 'public.json')} ${path.join(BUILD_DIR, 'proof.json')}`,
    { encoding: 'utf8' }
  ).trim();
  
  console.log(chalk.green('✓ Calldata generated successfully'));
  console.log(chalk.gray('\nCalldata (truncated):'));
  console.log(chalk.gray(calldata.substring(0, 100) + '...'));
  
  // Save calldata to file
  fs.writeFileSync(path.join(BUILD_DIR, 'calldata.txt'), calldata);
  console.log(chalk.green(`✓ Calldata saved to ${path.join(BUILD_DIR, 'calldata.txt')}`));
} catch (error) {
  console.error(chalk.red(`Failed to generate calldata: ${error.message}`));
  process.exit(1);
}

// Step 5: Generate deployment script
console.log(chalk.cyan('\n[5] Generating deployment script...'));
try {
  if (!fs.existsSync(path.join(__dirname, 'deploy.js'))) {
    const deployScript = `/**
 * Deployment script for ZK Data Access contracts
 */
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ZK Data Access contracts...");

  // Deploy the Verifier contract first
  const Verifier = await ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  
  console.log(\`Verifier deployed to \${await verifier.getAddress()}\`);

  // Then deploy the ZKDataAccess contract with the Verifier address
  const ZKDataAccess = await ethers.getContractFactory("ZKDataAccess");
  const zkDataAccess = await ZKDataAccess.deploy(await verifier.getAddress());
  await zkDataAccess.waitForDeployment();
  
  console.log(\`ZKDataAccess deployed to \${await zkDataAccess.getAddress()}\`);

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
  
  console.log(\`Registered resource #\${resourceId} with permission level \${requiredPermission}\`);
  
  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
`;
    fs.writeFileSync(path.join(__dirname, 'deploy.js'), deployScript);
    console.log(chalk.green('✓ Deployment script created at scripts/deploy.js'));
  } else {
    console.log(chalk.yellow('✓ Deployment script already exists'));
  }
} catch (error) {
  console.error(chalk.red(`Failed to create deployment script: ${error.message}`));
  // Non-critical error, continue
}

// Step 6: Summary
console.log(chalk.blue.bold('\n===== Demo Workflow Summary ====='));
console.log(chalk.white(`
1. We generated a witness for our circuit with the given inputs
2. We created a zero-knowledge proof that the user has sufficient permissions
3. We verified this proof using snarkjs, confirming it's valid
4. We prepared calldata that could be used for on-chain verification

Main privacy benefit: The user proved they have permission level >= 5,
without revealing their actual permission level (which is 10).
`));

console.log(chalk.yellow('\nNext steps:'));
console.log(chalk.yellow('1. Deploy the contracts: npx hardhat run scripts/deploy.js --network localhost'));
console.log(chalk.yellow('2. Start a hardhat node: npx hardhat node'));

console.log(chalk.blue.bold('\n===== Demo Complete =====\n'));

// Return success
process.exit(0); 