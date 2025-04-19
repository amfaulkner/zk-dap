/**
 * Script to compile the data_access.circom circuit and generate necessary files
 * for the zero-knowledge data access proof system.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration
const CIRCUIT_NAME = 'data_access';
const SRC_DIR = path.join(__dirname, '../circuits/src');
const BUILD_DIR = path.join(__dirname, '../circuits/build');
const PTAU_FILE = path.join(BUILD_DIR, 'pot12_final.ptau');
const NODE_MODULES_DIR = path.join(__dirname, '../node_modules');

// Create build directory if it doesn't exist
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

console.log(chalk.blue.bold('\n===== ZK Data Access Proof - Circuit Compilation =====\n'));

// Step 1: Check for circom installation
try {
  console.log(chalk.cyan('Checking circom installation...'));
  const circomVersion = execSync('circom --version', { encoding: 'utf8' }).trim();
  console.log(chalk.green(`✓ Found circom ${circomVersion}`));
} catch (error) {
  console.error(chalk.red('✗ circom not found. Please install circom 2.0:'));
  console.log(chalk.yellow('  1. cargo install circom'));
  process.exit(1);
}

// Step 2: Compile the circuit with Circom 2
try {
  console.log(chalk.cyan('\nCompiling circuit...'));
  execSync(
    `circom ${path.join(SRC_DIR, CIRCUIT_NAME + '.circom')} --r1cs --wasm --sym --output ${BUILD_DIR} -l ${NODE_MODULES_DIR}`,
    { stdio: 'inherit' }
  );
  console.log(chalk.green(`✓ Circuit compiled successfully to ${BUILD_DIR}`));
} catch (error) {
  console.error(chalk.red(`✗ Circuit compilation failed: ${error.message}`));
  process.exit(1);
}

// Step 3: Generate a small Powers of Tau file for our demo
if (!fs.existsSync(PTAU_FILE)) {
  console.log(chalk.cyan('\nGenerating Powers of Tau file...'));
  try {
    // Create a temporary directory for ptau generation
    const ptauTempDir = path.join(BUILD_DIR, 'ptau_temp');
    if (!fs.existsSync(ptauTempDir)) {
      fs.mkdirSync(ptauTempDir, { recursive: true });
    }

    // Initialize a new Powers of Tau ceremony
    console.log(chalk.yellow('Initializing new Powers of Tau (this may take a few minutes)...'));
    execSync(
      `npx snarkjs powersoftau new bn128 12 ${path.join(ptauTempDir, 'pot12_0000.ptau')} -v`,
      { stdio: 'inherit' }
    );
    
    // Add a contribution
    console.log(chalk.yellow('Adding contribution...'));
    execSync(
      `npx snarkjs powersoftau contribute ${path.join(ptauTempDir, 'pot12_0000.ptau')} ${path.join(ptauTempDir, 'pot12_0001.ptau')} --name="First contribution" -v -e="random text"`,
      { stdio: 'inherit' }
    );
    
    // Prepare for phase 2
    console.log(chalk.yellow('Preparing for phase 2...'));
    execSync(
      `npx snarkjs powersoftau prepare phase2 ${path.join(ptauTempDir, 'pot12_0001.ptau')} ${PTAU_FILE} -v`,
      { stdio: 'inherit' }
    );
    
    // Clean up temporary files
    console.log(chalk.yellow('Cleaning up temporary files...'));
    fs.rmSync(ptauTempDir, { recursive: true, force: true });
    
    console.log(chalk.green(`✓ Powers of Tau file generated at ${PTAU_FILE}`));
  } catch (error) {
    console.error(chalk.red(`✗ Failed to generate Powers of Tau file: ${error.message}`));
    process.exit(1);
  }
} else {
  console.log(chalk.green(`✓ Using existing Powers of Tau file at ${PTAU_FILE}`));
}

// Step 4: Generate zkey (proving and verification keys)
try {
  console.log(chalk.cyan('\nGenerating zkey files...'));
  
  // Generate initial zkey
  execSync(
    `npx snarkjs groth16 setup ${path.join(BUILD_DIR, CIRCUIT_NAME + '.r1cs')} ${PTAU_FILE} ${path.join(BUILD_DIR, CIRCUIT_NAME + '_0000.zkey')}`,
    { stdio: 'inherit' }
  );
  console.log(chalk.green('✓ Initial zkey generated'));
  
  // Contribute to the phase 2 ceremony
  execSync(
    `npx snarkjs zkey contribute ${path.join(BUILD_DIR, CIRCUIT_NAME + '_0000.zkey')} ${path.join(BUILD_DIR, CIRCUIT_NAME + '_final.zkey')} -n="First contribution" -e="random text"`,
    { stdio: 'inherit' }
  );
  console.log(chalk.green('✓ Contribution to zkey added'));
  
  // Export the verification key
  execSync(
    `npx snarkjs zkey export verificationkey ${path.join(BUILD_DIR, CIRCUIT_NAME + '_final.zkey')} ${path.join(BUILD_DIR, 'verification_key.json')}`,
    { stdio: 'inherit' }
  );
  console.log(chalk.green('✓ Verification key exported'));
  
} catch (error) {
  console.error(chalk.red(`✗ Failed to generate zkey files: ${error.message}`));
  process.exit(1);
}

// Step 5: Generate Solidity verifier
try {
  console.log(chalk.cyan('\nGenerating Solidity verifier...'));
  execSync(
    `npx snarkjs zkey export solidityverifier ${path.join(BUILD_DIR, CIRCUIT_NAME + '_final.zkey')} ${path.join(__dirname, '../contracts/zkdap/Verifier.sol')}`,
    { stdio: 'inherit' }
  );
  console.log(chalk.green('✓ Solidity verifier generated'));
  
  // Fix the solidity pragma version in the generated file
  const verifierPath = path.join(__dirname, '../contracts/zkdap/Verifier.sol');
  let verifierContent = fs.readFileSync(verifierPath, 'utf8');
  verifierContent = verifierContent.replace(/pragma solidity \^\d+\.\d+\.\d+/, 'pragma solidity ^0.8.19');
  fs.writeFileSync(verifierPath, verifierContent);
  console.log(chalk.green('✓ Solidity verifier pragma updated to ^0.8.19'));
  
} catch (error) {
  console.error(chalk.red(`✗ Failed to generate Solidity verifier: ${error.message}`));
  process.exit(1);
}

// Step 6: Prepare a sample input file
const sampleInput = {
  userPermission: 10,      // Private input (not revealed)
  requiredPermission: 5,   // Public input
  resourceId: 67890        // Public input
};

fs.writeFileSync(
  path.join(BUILD_DIR, 'input.json'), 
  JSON.stringify(sampleInput, null, 2)
);
console.log(chalk.green('\n✓ Sample input file created'));

console.log(chalk.blue.bold('\n===== Circuit Compilation Complete ====='));
console.log(chalk.yellow('\nNext steps:'));
console.log(chalk.yellow('1. Run the demo script: node scripts/zkdap-demo.js'));
console.log(chalk.yellow('2. Deploy the contracts with: npx hardhat run scripts/deploy.js'));

// Return success
process.exit(0); 