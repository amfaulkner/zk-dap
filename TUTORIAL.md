# Zero-Knowledge Data Access Proof (ZK-DAP) Tutorial

This tutorial guides you through running and understanding the Zero-Knowledge Data Access Proof (ZK-DAP) demo.

## Prerequisites

- Node.js (16+)
- Rust (for Circom 2.0)
- Basic understanding of Ethereum and smart contracts

## Part 1: Understanding the Demo

### What Is ZK-DAP?

ZK-DAP is a privacy-preserving access control system that allows users to prove they have sufficient permission to access a resource without revealing their actual permission level.

### Privacy Benefits

In traditional systems, a user must reveal their exact permission level to access a resource:
```
User: "I have permission level 10"
System: "Resource requires level 5. Access granted."
```

With ZK-DAP, the interaction becomes:
```
User: "I have a proof that my permission level is sufficient"
System: "Proof verified. Access granted."
```

The system never learns that the user has permission level 10, only that they meet the requirement.

## Part 2: Setup and Installation

### Step 1: Clone the Repository

```bash
cd zkdap-fresh
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Install Circom (if not already installed)

```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
cargo install circom
```

## Part 3: Understanding the Circuit

The heart of our ZK-DAP system is a Circom circuit that proves a user has sufficient permission:

```circom
// This is what our circuit does:
// - User has private permission level (e.g., 10)
// - Resource requires permission level (e.g., 5)
// - Circuit proves: userPermission >= requiredPermission

// The GreaterEqThan component from circomlib does the comparison
component comparison = GreaterEqThan(32);
comparison.in[0] <== userPermission;  // Private input
comparison.in[1] <== requiredPermission;  // Public input
accessGranted <== comparison.out;  // 1 if access granted, 0 otherwise
```

## Part 4: Running the Demo

### Step 1: Compile the Circuit

```bash
node scripts/compile-circuit.js
```

This will:
- Compile the circuit to R1CS and WebAssembly formats
- Generate a Powers of Tau file (cryptographic parameters)
- Create proving and verification keys
- Generate a Solidity verifier contract

### Step 2: Run the Full Demo

```bash
node scripts/zkdap-demo.js
```

This will:
- Generate a witness for the circuit with our sample inputs
- Create a zero-knowledge proof
- Verify the proof
- Prepare calldata for on-chain verification

Watch the colored output to see each step happen!

## Part 5: Smart Contract Interaction

### Step 1: Start a Local Ethereum Node

```bash
npx hardhat node
```

### Step 2: Deploy the Contracts

```bash
npx hardhat run scripts/deploy.js --network localhost
```

This deploys:
- `Verifier.sol`: Auto-generated contract that verifies ZK proofs
- `ZKDataAccess.sol`: Contract that manages resources and uses the verifier

### Step 3: Interact with the Contracts

Update the contract addresses in `scripts/interact.js` with the ones from deployment, then:

```bash
npx hardhat run scripts/interact.js --network localhost
```

This will simulate a user accessing a resource by providing a zero-knowledge proof.

## Part 6: Understanding the Cryptography

### Behind the Scenes

1. **Circuit Compilation**: Transforms our constraints into a system that can be proven
2. **Witness Generation**: Computes a solution to the circuit with our inputs
3. **Proof Generation**: Creates a zero-knowledge proof using zk-SNARKs
4. **Verification**: Confirms the proof is valid without learning private inputs

The magic of zero-knowledge proofs is that the verifier becomes convinced the user has sufficient permission without learning what that permission level actually is!

## Part 7: Next Steps

1. **Customize the Circuit**: Modify `data_access.circom` to handle more complex access rules
2. **Enhance the Contracts**: Add proper access control and upgradeability
3. **Build a Front End**: Create a UI for users to generate and submit proofs
4. **Deploy to a Testnet**: Try Sepolia or Mumbai for a more realistic environment

## Part 8: Troubleshooting

If you encounter issues:

- **Circuit Compilation**: Check Circom version and include paths
- **Witness Generation**: Verify inputs match circuit expectations
- **Contract Deployment**: Ensure Hardhat is configured correctly
- **Proof Verification**: Check that public inputs match between proof generation and verification

For more help, refer to the detailed [ZKDAP_COMPREHENSIVE_DOCUMENTATION.md](./ZKDAP_COMPREHENSIVE_DOCUMENTATION.md).

---

Congratulations! You've completed the ZK-DAP tutorial and gained an understanding of how zero-knowledge proofs can enhance privacy in access control systems.

Remember: The power of ZK-DAP is that it proves "knowing" without "revealing" - a powerful concept for privacy-preserving applications! 