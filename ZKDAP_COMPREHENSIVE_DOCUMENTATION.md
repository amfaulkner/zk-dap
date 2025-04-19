# Zero-Knowledge Data Access Proof (ZK-DAP) System

## Table of Contents

1. [System Overview](#system-overview)
2. [Technical Architecture](#technical-architecture)
3. [Components and Libraries](#components-and-libraries)
4. [Flow Diagram](#flow-diagram)
5. [Circuit Explanation](#circuit-explanation)
6. [Smart Contracts](#smart-contracts)
7. [Scripts and Utilities](#scripts-and-utilities)
8. [Cryptographic Primitives](#cryptographic-primitives)
9. [Usage Guide](#usage-guide)
10. [Deployment Instructions](#deployment-instructions)
11. [Security Considerations](#security-considerations)
12. [Troubleshooting](#troubleshooting)

## System Overview

The Zero-Knowledge Data Access Proof (ZK-DAP) system enables privacy-preserving access control to resources. It allows users to prove they have sufficient permission to access a resource without revealing their actual permission level, using zero-knowledge proofs.

**Core Privacy Benefit**: Users prove eligibility (having a permission level ≥ required level) without disclosing their actual permission level.

### Core Components

- **Prover**: Entity with a private permission level wanting to access a resource
- **Verifier**: Entity controlling access to a resource based on permission requirements
- **Circuit**: Defines the mathematical constraints that prove a user has sufficient permission
- **Smart Contracts**: On-chain components for verification and resource management

### Main Use Cases

1. **Privacy-Preserving Access Control**: Grant access based on minimum qualifications without exposing actual credentials
2. **Confidential Document Access**: Allow users to prove they have clearance without revealing their exact clearance level
3. **Age Verification**: Prove someone is above a required age without revealing their exact birthdate
4. **Salary Requirements**: Prove income exceeds a threshold without revealing exact income

## Technical Architecture

### High-Level Architecture

```
┌───────────────┐         ┌──────────────┐         ┌───────────────┐
│  User/Prover  │◄────────┤ ZK Protocol  ├────────►│   Verifier    │
└───────┬───────┘         └──────────────┘         └───────┬───────┘
        │                                                  │
        │                                                  │
        ▼                                                  ▼
┌───────────────┐                               ┌───────────────────┐
│ Private Input │                               │ Resource Access   │
│ (Permission)  │                               │ Decision          │
└───────────────┘                               └───────────────────┘
```

### Cryptographic Flow

1. **Circuit Definition**: Define the mathematical constraints for the permission check
2. **Trusted Setup**: Generate proving and verification keys
3. **Proof Generation**: User creates a proof with private and public inputs
4. **Verification**: Verifier checks the proof's validity without learning private inputs

## Components and Libraries

### Core Libraries

1. **Circom (v2.0.0)**
   - **Purpose**: Circuit definition language and compiler
   - **Function**: Transforms mathematical constraints into a format usable for proof generation
   - **Usage in ZK-DAP**: Defines the permission comparison logic

2. **SnarkJS (v0.7.x)**
   - **Purpose**: JavaScript implementation of zk-SNARK protocols
   - **Function**: Handles witness generation, proof creation, and verification
   - **Usage in ZK-DAP**: Provides the cryptographic workflow for our zero-knowledge proofs

3. **Hardhat (v2.19.x)**
   - **Purpose**: Ethereum development environment
   - **Function**: Manages smart contract compilation, deployment, and testing
   - **Usage in ZK-DAP**: Orchestrates the deployment of verifier contracts

4. **Solidity (v0.8.19)**
   - **Purpose**: Smart contract programming language
   - **Function**: Defines on-chain logic for contract interactions
   - **Usage in ZK-DAP**: Implements the Verifier and ZKDataAccess contracts

5. **Ethers.js (v6.x)**
   - **Purpose**: Ethereum JavaScript API
   - **Function**: Facilitates interaction with the Ethereum blockchain
   - **Usage in ZK-DAP**: Used in deployment and interaction scripts

6. **circomlib (v2.0.5)**
   - **Purpose**: Library of Circom circuits and components
   - **Function**: Provides reusable circuit components
   - **Usage in ZK-DAP**: Supplies the comparison operators for our circuit

### Supporting Libraries

1. **Chalk**
   - **Purpose**: Terminal string styling
   - **Function**: Enhances console output with colors and formatting
   - **Usage in ZK-DAP**: Improves readability of script outputs

## Flow Diagram

```
          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │                  Setup Phase                      │
          │                                                   │
          └────────────────────────┬──────────────────────────┘
                                   │
                                   ▼
┌─────────────────┐  ┌─────────────────────────┐  ┌─────────────────────┐
│                 │  │                         │  │                     │
│ Circuit         │  │ Powers of Tau           │  │ Generate            │
│ Compilation     │──► Ceremony                ├──► zk-SNARK Keys       │
│ (circom)        │  │ (snarkjs)               │  │ (snarkjs)           │
│                 │  │                         │  │                     │
└─────────────────┘  └─────────────────────────┘  └──────────┬──────────┘
                                                             │
                                                             │
          ┌───────────────────────────────────────────────────┐
          │                                                   │
          │               Operational Phase                   │
          │                                                   │
          └────────────────────────┬──────────────────────────┘
                                   │
                                   ▼
┌─────────────────┐  ┌─────────────────────────┐  ┌─────────────────────┐
│                 │  │                         │  │                     │
│ Generate        │  │ Create ZK               │  │ Verify              │
│ Witness         │──► Proof                   ├──► Proof               │
│ (snarkjs)       │  │ (snarkjs)               │  │ (snarkjs/Solidity)  │
│                 │  │                         │  │                     │
└─────────────────┘  └─────────────────────────┘  └─────────────────────┘
```

## Circuit Explanation

### The `data_access.circom` Circuit

```circom
pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";

template DataAccess() {
    // Private input - not revealed
    signal input userPermission;
    
    // Public inputs
    signal input requiredPermission;
    signal input resourceId;
    
    // Output signal
    signal output accessGranted;
    
    // Use the greaterEqThan component to check if userPermission >= requiredPermission
    component comparison = GreaterEqThan(32); // 32-bit comparison
    comparison.in[0] <== userPermission;
    comparison.in[1] <== requiredPermission;
    
    // Set the access result based on the comparison
    accessGranted <== comparison.out;
    
    // Include resourceId in the circuit for verification
    signal resourceIdCheck;
    resourceIdCheck <== resourceId;
}

component main {public [requiredPermission, resourceId]} = DataAccess();
```

### Circuit Components Explained

1. **Pragma Statement**
   - `pragma circom 2.0.0;` - Specifies the version of Circom used (2.0.0)

2. **Include Statement**
   - `include "circomlib/circuits/comparators.circom";` - Imports the comparator components from circomlib

3. **Template Definition**
   - `template DataAccess()` - Defines a reusable circuit template

4. **Signal Declarations**
   - `signal input userPermission;` - Private input (user's actual permission level)
   - `signal input requiredPermission;` - Public input (required permission level)
   - `signal input resourceId;` - Public input (resource identifier)
   - `signal output accessGranted;` - Output signal (1 if access granted, 0 otherwise)

5. **Component Instantiation**
   - `component comparison = GreaterEqThan(32);` - Creates a 32-bit comparison component

6. **Signal Assignment**
   - `comparison.in[0] <== userPermission;` - Assigns user's permission to first input
   - `comparison.in[1] <== requiredPermission;` - Assigns required permission to second input
   - `accessGranted <== comparison.out;` - Sets output based on comparison result

7. **Main Component**
   - `component main {public [requiredPermission, resourceId]} = DataAccess();` - Defines circuit entry point and specifies public inputs

### What the Circuit Does

The circuit performs a simple comparison to determine if a user's permission level (private) is greater than or equal to a required permission level (public). This allows a user to prove they have sufficient permission without revealing their actual permission level.

## Smart Contracts

### Verifier.sol (Auto-generated)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Verifier {
    // Auto-generated verifier contract from snarkjs
    // Contains complex elliptic curve operations for verifying Groth16 proofs
    
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) public view returns (bool) {
        // Verification logic
        // ...
    }
}
```

**Purpose**: Verifies zero-knowledge proofs on-chain.

**How It Works**:
1. The contract implements the Groth16 verification algorithm
2. It receives proof components (a, b, c) and public inputs
3. It performs elliptic curve operations to verify the proof's validity
4. It returns true if the proof is valid, false otherwise

### ZKDataAccess.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ZKDataAccess {
    // The verifier contract address
    address public verifierContract;
    
    // Maps resourceId to their required permission level
    mapping(uint256 => uint256) public resourcePermissions;
    
    // Maps resourceId to their data
    mapping(uint256 => string) public resourceData;
    
    // Events
    event ResourceRegistered(uint256 indexed resourceId, uint256 requiredPermission);
    event AccessVerified(uint256 indexed resourceId, bool accessGranted);
    
    constructor(address _verifierContract) {
        verifierContract = _verifierContract;
    }
    
    function registerResource(
        uint256 resourceId,
        uint256 requiredPermission,
        string memory data
    ) external {
        resourcePermissions[resourceId] = requiredPermission;
        resourceData[resourceId] = data;
        
        emit ResourceRegistered(resourceId, requiredPermission);
    }
    
    function verifyAccess(
        uint256 resourceId,
        bytes memory proof,
        uint256[2] memory publicSignals
    ) external view returns (bool accessGranted, string memory data) {
        // Verification logic
        // ...
    }
    
    function updateVerifier(address _newVerifier) external {
        verifierContract = _newVerifier;
    }
}
```

**Purpose**: Manages resources and their access requirements.

**Key Functions**:
1. `registerResource`: Registers a new resource with permission requirements
2. `verifyAccess`: Verifies a user's proof to grant access to a resource
3. `updateVerifier`: Updates the address of the verifier contract

**State Variables**:
1. `verifierContract`: Address of the Groth16 verifier contract
2. `resourcePermissions`: Mapping from resource ID to required permission level
3. `resourceData`: Mapping from resource ID to resource data

## Scripts and Utilities

### compile-circuit.js

**Purpose**: Compiles the Circom circuit and generates necessary cryptographic parameters.

**Steps**:
1. Checks Circom installation
2. Compiles the circuit to R1CS and WebAssembly formats
3. Generates or uses an existing Powers of Tau file
4. Generates zKey files (proving and verification keys)
5. Exports the Solidity verifier contract
6. Creates a sample input file

**Key Functions**:
- Circuit compilation: `circom data_access.circom --r1cs --wasm --sym --output`
- Powers of Tau: `snarkjs powersoftau new/contribute/prepare`
- Setup: `snarkjs groth16 setup`
- Key export: `snarkjs zkey export verificationkey/solidityverifier`

### zkdap-demo.js

**Purpose**: Demonstrates the entire ZK-DAP workflow.

**Steps**:
1. Checks if circuit is compiled, runs compilation if needed
2. Reads input data and displays the scenario
3. Generates a witness from the circuit and input
4. Creates a zero-knowledge proof
5. Verifies the proof
6. Generates calldata for on-chain verification
7. Creates/checks for a deployment script

**Key Functions**:
- Witness generation: `snarkjs wtns calculate`
- Proof creation: `snarkjs groth16 prove`
- Proof verification: `snarkjs groth16 verify`
- Calldata generation: `snarkjs zkey export soliditycalldata`

### deploy.js

**Purpose**: Deploys the Verifier and ZKDataAccess contracts.

**Steps**:
1. Deploys the Verifier contract
2. Deploys the ZKDataAccess contract with the Verifier address
3. Registers a sample resource

**Key Functions**:
- Contract deployment: `ethers.getContractFactory().deploy()`
- Transaction execution: `zkDataAccess.registerResource(...)`

### interact.js

**Purpose**: Demonstrates interaction with deployed contracts.

**Steps**:
1. Connects to deployed contracts
2. Fetches resource details
3. Reads proof calldata from file
4. Simulates verifying access with the proof

**Key Functions**:
- Contract instance retrieval: `ethers.getContractAt()`
- Reading contract state: `zkDataAccess.resourcePermissions()`
- Processing proof data for verification

## Cryptographic Primitives

### Zero-Knowledge Proofs

**What They Are**: Cryptographic methods that allow one party (prover) to prove to another party (verifier) that a statement is true without revealing any additional information.

**Type Used**: zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) with Groth16 protocol

**Properties**:
- **Completeness**: If the statement is true, an honest verifier will be convinced by an honest prover
- **Soundness**: If the statement is false, no cheating prover can convince an honest verifier
- **Zero-Knowledge**: The verifier learns nothing beyond the validity of the statement

### Powers of Tau Ceremony

**What It Is**: A multi-party computation ritual that creates parameters for zk-SNARKs.

**Purpose**: Establishes a trusted setup that, if at least one participant is honest, ensures the cryptographic security of the system.

**In Our Implementation**: 
- We create a small Powers of Tau file for demonstration purposes
- In production, you would use parameters from a large, trusted ceremony

### Groth16 Protocol

**What It Is**: A widely-used zk-SNARK proving system.

**Advantages**:
- Very small proof size
- Fast verification time
- Constant-size proofs regardless of computation complexity

**Components**:
- **R1CS**: Rank-1 Constraint System (represents the circuit constraints)
- **zKey**: Contains proving and verification keys
- **Proof**: Contains the cryptographic elements (pi_a, pi_b, pi_c)
- **Public Inputs**: Values known to both prover and verifier

## Usage Guide

### Prerequisites

- Node.js >= 16
- Rust (for Circom 2)
- Circom 2.0 (`cargo install circom`)
- Access to an Ethereum network (local or testnet)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. If Circom is not installed:
   ```
   curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
   cargo install circom
   ```

### Running the Demo

1. Compile the circuit:
   ```
   npx hardhat compile-circuit
   ```
   or
   ```
   node scripts/compile-circuit.js
   ```

2. Run the full demo:
   ```
   npx hardhat zkdap-demo
   ```
   or
   ```
   node scripts/zkdap-demo.js
   ```

3. Deploy contracts:
   ```
   npx hardhat node
   npx hardhat run scripts/deploy.js --network localhost
   ```

4. Interact with contracts:
   ```
   npx hardhat run scripts/interact.js --network localhost
   ```

## Deployment Instructions

### Local Testnet

1. Start a local Hardhat node:
   ```
   npx hardhat node
   ```

2. Deploy the contracts:
   ```
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. Take note of the deployed contract addresses and update `interact.js` with these addresses.

### External Testnet (e.g., Sepolia)

1. Configure Hardhat for the testnet by updating `hardhat.config.js`:
   ```javascript
   networks: {
     sepolia: {
       url: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
       accounts: [process.env.PRIVATE_KEY]
     }
   }
   ```

2. Set environment variables:
   ```
   export PRIVATE_KEY=your_private_key
   ```

3. Deploy to the testnet:
   ```
   npx hardhat run scripts/deploy.js --network sepolia
   ```

4. Update `interact.js` with the deployed contract addresses and run:
   ```
   npx hardhat run scripts/interact.js --network sepolia
   ```

## Security Considerations

1. **Trusted Setup**
   - In production, use parameters from a well-established Powers of Tau ceremony
   - The security relies on at least one participant being honest

2. **Circuit Design**
   - Ensure the circuit correctly models the access control rules
   - Test with various input combinations to verify correctness

3. **Smart Contract Security**
   - Add proper access control for administrative functions
   - Consider upgradeability patterns for long-term deployments
   - Conduct thorough audits before production deployment

4. **Input Validation**
   - Always validate inputs on-chain before verification
   - Ensure resource IDs match expected public inputs

5. **Privacy Leakage**
   - Be careful not to inadvertently leak information through transaction patterns
   - Consider using relayers or other techniques to enhance privacy

## Troubleshooting

### Common Issues

1. **Circom Compilation Errors**
   - Check Circom version (`circom --version`)
   - Verify include paths are correct
   - Ensure circuit syntax is valid for Circom 2.0

2. **Witness Generation Failures**
   - Verify the WebAssembly file exists
   - Check input format matches circuit expectations
   - Look for constraints that might be unsatisfiable

3. **Proof Verification Failures**
   - Ensure public inputs match between proof generation and verification
   - Check that the verification key matches the proving key
   - Verify the circuit hasn't changed since key generation

4. **Smart Contract Deployment Issues**
   - Check network configuration in Hardhat
   - Ensure account has sufficient funds
   - Verify Solidity version compatibility

5. **Powers of Tau Problems**
   - If download fails, use the built-in generation process
   - For larger circuits, you may need a larger Powers of Tau file

### Support Resources

- [Circom Documentation](https://docs.circom.io/)
- [snarkjs GitHub](https://github.com/iden3/snarkjs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Zero-Knowledge Proof Resources](https://zkp.science/) 