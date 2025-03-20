const { writeFileSync } = require("fs");
const { network } = require("hardhat");
const PullServiceClient = require("./pullServiceClient");

// testnet: testnet-dora-2.supra.com(v2), testnet-dora.supraoracles.com(v1)
// mainnet: mainnet-dora.supraoracles.com
const grpc_address_test = "testnet-dora-2.supra.com";
const grpc_address_main = "mainnet-dora.supraoracles.com";

const pairIndexes = [0, 18, 19, 48, 61, 65]; // Set the pair indexes as an array
const chainType = "evm"; // Set the chain type (evm, sui, aptos)

const client_test = new PullServiceClient(grpc_address_test);
const client_main = new PullServiceClient(grpc_address_main);

const request = {
    pair_indexes: pairIndexes,
    chain_type: chainType,
};
console.log("Requesting proof for price index : ", request.pair_indexes);

client_test.getProof(request, (err, response) => {
    if (err) {
        console.error("Error:", err.details);
        return;
    }
    console.log("Calling contract to verify the proofs.. ");
    writeFileSync(
        `${__dirname}/scripts/proofbytes_test.txt`,
        JSON.stringify(response.evm.proof_bytes, null, 2)
    );
    console.log("test proofbytes generated successfully!");
});

client_main.getProof(request, (err, response) => {
    if (err) {
        console.error("Error:", err.details);
        return;
    }
    console.log("Calling contract to verify the proofs.. ");
    writeFileSync(
        `${__dirname}/scripts/proofbytes_main.txt`,
        JSON.stringify(response.evm.proof_bytes, null, 2)
    );
    console.log("main proofbytes generated successfully!");
});
