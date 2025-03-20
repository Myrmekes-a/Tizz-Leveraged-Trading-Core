const { ethers, network } = require("hardhat");
const { getContract } = require("hardhat-libutils");
const { getProofBytes } = require("../params");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(
        "Testing Tizz Finance Contracts with wallet: ",
        deployer.address
    );

    const collateralType = "WBTC";
    const TizzFundingFees = await getContract(
        "TizzFundingFees",
        `TizzFundingFees${collateralType}`
    );
    let pairIndex = 0;
    let proofbytes = getProofBytes();
    let tx = await TizzFundingFees.syncFundingFee(pairIndex, proofbytes);
    await tx.wait();

    console.log("Done");
}

main()
    .then(() => {
        process.exit(1);
    })
    .catch((error) => {
        console.error(error);
    });
