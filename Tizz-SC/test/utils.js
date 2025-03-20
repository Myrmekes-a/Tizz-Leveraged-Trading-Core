const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { writeFileSync, readFileSync } = require("fs");
const { ethers, network } = require("hardhat");

let PROTO_PATH = `${__dirname}/../protos/client.proto`;
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const pullProto = grpc.loadPackageDefinition(packageDefinition).pull_service;
let client;
if (network.name == "botanix_test" || network.name == "arbitrum_sepolia") {
    client = new pullProto.PullService(
        "testnet-dora.supraoracles.com",
        grpc.credentials.createSsl()
    );
} else {
    client = new pullProto.PullService(
        "mainnet-dora.supraoracles.com",
        grpc.credentials.createSsl()
    );
}

const pairIndexes = [0, 18, 21, 48, 61, 65]; // Set the pair indexes as an array
const chainType = "evm"; // Set the chain type (evm, sui, aptos)
const request = {
    pair_indexes: pairIndexes,
    chain_type: chainType,
};
console.log("Requesting proof for price index : ", request.pair_indexes);

const getClientProof = () => {
    client.getProof(request, (err, response) => {
        if (err) {
            console.error("Error:", err.details);
            return;
        }
        console.log("Calling contract to verify the proofs.. ");
        console.log(response.evm.proof_bytes);
        const addressDir = `${__dirname}`;
        writeFileSync(
            `${__dirname}/proofbytes.txt`,
            JSON.stringify(response.evm.proof_bytes, null, 2)
        );
    });
};

const openPnlFeedIds = [0, 1, 2, 3, 4, 5, 6];
const openPnlFeedRequest = {
    pair_indexes: openPnlFeedIds,
    chain_type: chainType,
};
const getOpenPnlFeedProof = () => {
    client.getProof(openPnlFeedRequest, (err, response) => {
        if (err) {
            console.error("Error:", err.details);
            return;
        }
        console.log("Calling contract to verify the proofs.. ");
        console.log(response.evm.proof_bytes);
        writeFileSync(
            `${__dirname}/proofbytes_openpnl.txt`,
            JSON.stringify(response.evm.proof_bytes, null, 2)
        );
    });
};

const getSimpleProofBytes = () => {
    let jsonData = readFileSync(`${__dirname}/proofbytes_simple.txt`);
    jsonData = JSON.parse(jsonData, null, 2);
    return ethers.utils.hexlify(jsonData.data);
};

const getProofBytes = () => {
    let jsonData = readFileSync(`${__dirname}/proofbytes.txt`);
    jsonData = JSON.parse(jsonData, null, 2);
    return ethers.utils.hexlify(jsonData.data);
};

const getOpenPnlProofBytes = () => {
    let jsonData = readFileSync(`${__dirname}/proofbytes_openpnl.txt`);
    jsonData = JSON.parse(jsonData, null, 2);
    return ethers.utils.hexlify(jsonData.data);
};

// getClientProof();
// getOpenPnlFeedProof();

module.exports = {
    getSimpleProofBytes,
    getProofBytes,
    getOpenPnlProofBytes,
};
