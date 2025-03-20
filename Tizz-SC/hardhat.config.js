/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("hardhat-abi-exporter");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-contract-sizer");
require("solidity-coverage");
require("@grpc/grpc-js");
require("@grpc/proto-loader");
require("dotenv").config();
require("hardhat-gas-reporter");
const { utils } = require("ethers");

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            forking: {
                url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ARBITRUM_API}`,
                blockNumber: 206393076,
            },
            // loggingEnabled: true,
        },
        arbitrum: {
            url: "https://arbitrum.drpc.org",
            chainId: 42161,
            accounts: [process.env.DEPLOY_WALLET],
        },
        botanix_test: {
            url: "https://node.botanixlabs.dev",
            chainId: 3636,
            accounts: [process.env.DEPLOY_WALLET],
            gasPrice: utils.parseUnits("0.005", "gwei").toNumber(),
        },
        arbitrum_sepolia: {
            url: `https://arb-sepolia.g.alchemy.com/v2/${process.env.ARBITRUM_SEPOLIA_API_KEY}`,
            chainId: 421614,
            accounts: [process.env.DEPLOY_WALLET],
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.17",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 125,
                    },
                },
            },
            {
                version: "0.8.0",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 125,
                    },
                },
            },
        ],
    },
    etherscan: {
        apiKey: {
            arbitrumOne: process.env.ARBITRUM_API_KEY,
            arbitrumSepolia: process.env.ARBITRUM_API_KEY,
        },
        customChains: [
            {
                network: "arbitrumSepolia",
                chainId: 421614,
                urls: {
                    apiURL: "https://api-sepolia.arbiscan.io/api",
                    browserURL: "https://sepolia.arbiscan.io/",
                },
            },
        ],
    },
    gasReporter: {
        enabled: false,
    },

    abiExporter: [
        {
            path: "./c_abi/json",
            format: "json",
            runOnCompile: true,
        },
        {
            path: "./c_abi/minimal",
            format: "minimal",
            runOnCompile: true,
        },
        {
            path: "./c_abi/fullName",
            format: "fullName",
            runOnCompile: true,
        },
    ],

    mocha: {
        timeout: 200000,
    },

    paths: {
        artifacts: "./c_artifacts",
    },
};
