/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    }
  },
  // Add a custom task for ZK Data Access demo
  mocha: {
    timeout: 40000
  }
};

// Define custom task to run the demo
task("zkdap-demo", "Run the ZK Data Access Proof demo")
  .setAction(async (taskArgs) => {
    console.log("Running ZK Data Access Proof demo...");
    const { execSync } = require("child_process");
    execSync("node scripts/zkdap-demo.js", { stdio: "inherit" });
  });

// Define custom task to compile the circuit
task("compile-circuit", "Compile the ZK Data Access circuit")
  .setAction(async (taskArgs) => {
    console.log("Compiling ZK Data Access circuit...");
    const { execSync } = require("child_process");
    execSync("node scripts/compile-circuit.js", { stdio: "inherit" });
  }); 