# Zero-Knowledge Data Access Proof (ZK-DAP)

This project demonstrates a privacy-preserving data access control system using zero-knowledge proofs. It allows users to prove they have sufficient permission to access a resource without revealing their actual permission level.

## Overview

The Zero-Knowledge Data Access Proof (ZK-DAP) system uses:
- **Circom 2.0** to define the circuit logic
- **SnarkJS** for generating and verifying zero-knowledge proofs
- **Hardhat** for smart contract development and deployment
- **Solidity** for on-chain verification

## Project Structure

```
zkdap-fresh/
├── circuits/
│   ├── src/         # Circuit source files
│   └── build/       # Compiled circuits and keys
├── contracts/
│   └── zkdap/       # Smart contracts for on-chain verification
├── scripts/         # Helper scripts
│   ├── compile-circuit.js    # Compiles the circuit
│   ├── deploy.js             # Deploys contracts
│   └── zkdap-demo.js         # Runs complete demo
└── test/            # Contract tests
```

## Circuit Design

The main circuit (`data_access.circom`) proves that:
- A user has a permission level (private input)
- The permission level is greater than or equal to the required level (public input)
- The proof is tied to a specific resource ID (public input)

## Prerequisites

- Node.js >= 16
- Rust (for Circom 2)
- Circom 2.0 (`cargo install circom`)

## Installation

1. Install dependencies:
   ```
   npm install
   ```

2. If Circom is not installed:
   ```
   curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
   cargo install circom
   ```

## Usage

### Compiling the Circuit

```
npx hardhat compile-circuit
```

Or:
```
node scripts/compile-circuit.js
```

This will:
- Compile the circuit
- Generate the R1CS and WASM files
- Download the Powers of Tau file if needed
- Generate the proving and verification keys
- Create the Solidity verifier contract

### Running the Demo

```
npx hardhat zkdap-demo
```

Or:
```
node scripts/zkdap-demo.js
```

This demonstrates:
1. Witness generation
2. Proof creation
3. Proof verification
4. Generating calldata for on-chain verification

### Deploying Contracts

Start a local Hardhat node:
```
npx hardhat node
```

Then deploy the contracts:
```
npx hardhat run scripts/deploy.js --network localhost
```

## License

MIT 
