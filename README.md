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

## Privacy Benefits

The ZK-DAP system provides the following privacy benefits:
- Users never reveal their actual permission level
- Only the fact that the user has sufficient permission is verified
- The system can enforce access control without knowing sensitive user credential details
- All access checks are cryptographically secure

Zero-Knowledge Data Access Proof (ZK-DAP) Technical Flow
1. Circuit Compilation & Setup Phase
┌───────────────────────┐     ┌──────────────────────────┐     ┌─────────────────────────┐
│                       │     │                          │     │                         │
│  data_access.circom   │     │  Powers of Tau           │     │  Cryptographic          │
│  Circuit Definition   │────►│  Ceremony                │────►│  Parameters             │
│                       │     │                          │     │  Generation             │
│                       │     │                          │     │                         │
└───────────┬───────────┘     └──────────────┬───────────┘     └────────────┬────────────┘
            │                                │                              │
            │                                │                              │
            ▼                                ▼                              ▼
┌───────────────────────┐     ┌──────────────────────────┐     ┌─────────────────────────┐
│                       │     │                          │     │                         │
│  R1CS Representation  │     │  WebAssembly             │     │  Proving &              │
│  (Constraints)        │     │  Compilation             │     │  Verification Keys      │
│                       │     │                          │     │                         │
└───────────────────────┘     └──────────────────────────┘     └─────────────────────────┘
Explanation:

The circuit is defined in data_access.circom using Circom 2.0 syntax
compile-circuit.js compiles the circuit to:
R1CS (Rank-1 Constraint System) representation of constraints
WebAssembly code for witness generation
A Powers of Tau ceremony is performed (or parameters are reused)
Proving and verification keys are generated for the zk-SNARK system
Technical details:

Commands executed:
circom data_access.circom --r1cs --wasm --sym
snarkjs powersoftau new/contribute/prepare
snarkjs groth16 setup
snarkjs zkey export verificationkey/solidityverifier
2. Proof Generation & Verification Flow
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │     │                   │
│  Private Input    │     │  Public Inputs    │     │  WebAssembly      │
│  (userPermission) │────►│  (resourceId,     │────►│  Witness          │
│                   │     │   reqPermission)  │     │  Generation       │
│                   │     │                   │     │                   │
└───────────────────┘     └───────────────────┘     └─────────┬─────────┘
                                                              │
                                                              │
                                                              ▼
┌────────────────────────────────────┐     ┌─────────────────────────────┐
│                                    │     │                             │
│  Verification                      │     │  Zero-Knowledge             │
│  (On-chain or Off-chain)           │◄────┤  Proof Generation          │
│                                    │     │                             │
└────────────────────────────────────┘     └─────────────────────────────┘
Explanation:

User provides private input (permission level) and gets public inputs (required permission, resource ID)
Witness is generated using the WebAssembly circuit implementation
Zero-knowledge proof is created using the witness and proving key
Proof can be verified either off-chain (using snarkjs) or on-chain (using the Verifier contract)
Technical details:

Commands executed:
snarkjs wtns calculate [wasm] [input] [witness]
snarkjs groth16 prove [zkey] [witness] [proof] [public]
snarkjs groth16 verify [vkey] [public] [proof]
3. Smart Contract Architecture
                        ┌─────────────────────────────────────┐
                        │                                     │
                        │  ZKDataAccess Contract              │
                        │  - Resource registration            │
                        │  - Permission management            │
                        │  - Access control                   │
                        │                                     │
                        └──────────────────┬──────────────────┘
                                           │
                                           │ calls
                                           │
                                           ▼
┌────────────────────┐     ┌─────────────────────────────────────┐
│                    │     │                                     │
│  User with Proof   │────►│  Verifier Contract                  │
│                    │     │  - Validates zero-knowledge proofs  │
│                    │     │  - Returns true/false               │
└────────────────────┘     │                                     │
                           └─────────────────────────────────────┘
Explanation:

The ZKDataAccess contract manages resources and their permission requirements
Users present proofs to the system when requesting access
The Verifier contract (auto-generated) validates the cryptographic proofs
Access is granted only if the proof is valid, without revealing the user's actual permission level
Technical details:

Contract interfaces:
// ZKDataAccess interface
function registerResource(uint256 resourceId, uint256 requiredPermission, string memory data)
function verifyAccess(uint256 resourceId, bytes memory proof, uint256[2] memory publicSignals)
  returns (bool accessGranted, string memory data)

// Verifier interface
function verifyProof(uint[2] a, uint[2][2] b, uint[2] c, uint[2] input) returns (bool)
4. End-to-End User Flow
┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│             │       │             │       │             │       │             │       │             │
│  User with  │       │  Generate   │       │  Create     │       │  Submit     │       │  Access     │
│  Private    │──────►│  Witness    │──────►│  ZK Proof   │──────►│  Proof to   │──────►│  Resource   │
│  Permission │       │             │       │             │       │  Contract   │       │             │
│             │       │             │       │             │       │             │       │             │
└─────────────┘       └─────────────┘       └─────────────┘       └─────────────┘       └─────────────┘
Explanation:

User has a private permission level they want to keep confidential
Client-side code generates a witness for the circuit using inputs
Zero-knowledge proof is created proving the user has sufficient permission
Proof is submitted to the ZKDataAccess contract along with public inputs
If verification succeeds, access to the resource is granted
Technical flow:

The user runs client-side code to generate a witness:
const { wtnsCalculate } = require('snarkjs').wtns;
await wtnsCalculate(wasm, inputJson, witnessPath);
The proof is generated:
const { prove } = require('snarkjs').groth16;
const { proof, publicSignals } = await prove(zkeyPath, witnessPath);
The proof is formatted for contract submission using:
const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
User submits the proof to the contract:
const tx = await zkDataAccess.verifyAccess(resourceId, proof, publicSignals);
5. Data Flow Through the System
┌──────────────────────┐
│  Input Data          │
├──────────────────────┤
│  Private:            │
│  - userPermission: 10│
│                      │
│  Public:             │
│  - reqPermission: 5  │
│  - resourceId: 67890 │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐    ┌──────────────────────┐
│  Circuit Processing  │    │  Witness             │
├──────────────────────┤    ├──────────────────────┤
│  comparison =        │    │  Complete assignment │
│  GreaterEqThan(32)   │───►│  of all signals in   │
│  comparison.out = 1  │    │  the circuit         │
└──────────┬───────────┘    └──────────┬───────────┘
           │                           │
           └───────────────────────────┘
                         │
                         ▼
┌──────────────────────┐    ┌──────────────────────┐
│  Proof               │    │  Public Output       │
├──────────────────────┤    ├──────────────────────┤
│  Complex elliptic    │    │  - accessGranted: 1  │
│  curve points that   │    │  - reqPermission: 5  │
│  prove the statement │    │  - resourceId: 67890 │
└──────────┬───────────┘    └──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  Verification        │
├──────────────────────┤
│  Check proof against │
│  verification key    │
│  and public inputs   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Access Decision     │
├──────────────────────┤
│  Grant access to     │
│  resource #67890     │
└──────────────────────┘
Key Insight:
Throughout this entire process, the user's actual permission level (10) is never revealed. The system only learns that the user has sufficient permission (≥ 5) to access the resource.

This is the core privacy benefit of the ZK-DAP system - proving eligibility without revealing sensitive information.

## License

MIT 
