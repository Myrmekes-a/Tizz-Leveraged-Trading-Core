const { ethers, network } = require("hardhat");
const {
    getContract,
    bigNum,
    smallNum,
    deploy,
    getCurrentTimestamp,
} = require("hardhat-libutils");
const { getProofBytes } = require("../params");
const { getCollateralType } = require("../collateralTypes");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(
        "Testing Tizz Finance Contracts with wallet: ",
        deployer.address
    );
    const collateralType = getCollateralType();

    let tx;
    const pairIndex = 0; // BTC
    const index = 0;
    const bytesProof = getProofBytes();

    const collateralToken = await getContract(
        "MockToken",
        `Mock${collateralType}`
    );
    const TizzTrading = await getContract(
        "TizzTrading",
        `TizzTrading${collateralType}`
    );

    const TizzTradingStorage = await getContract(
        "TizzTradingStorage",
        `TizzTradingStorage${collateralType}`
    );

    console.log(
        "before open trades count: ",
        await TizzTradingStorage.openTradesCount(deployer.address, pairIndex)
    );
    tx = await TizzTrading.closeTradeMarket(pairIndex, index, bytesProof);
    await tx.wait();
    console.log(
        "after open trades count: ",
        await TizzTradingStorage.openTradesCount(deployer.address, pairIndex)
    );

    console.log("Done");
}

main()
    .then(() => {
        process.exit(1);
    })
    .catch((error) => {
        console.error(error);
    });
