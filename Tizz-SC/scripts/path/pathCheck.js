const { ethers } = require("hardhat");
const {
    checkTizzFundingFees,
    syncFundingRate,
    openMarket,
    getTradeFundingFee,
    getTradeLiquidationPrice,
    checkTriggerOrder,
} = require("./pathHelper");
const { bigNum, smallNum, getContract } = require("hardhat-libutils");
const { getProofBytes } = require("../params");

async function predictTizzFundingFees(collateralType) {
    let WBTCPairIndex = 0;
    let USDTPairIndex = 1;
    let collateralAmount = bigNum(1, 8);
    let leverage = 5;
    let long = true;

    let [fundingFees, fundingRate] = await checkTizzFundingFees(
        collateralType,
        deployer.address,
        WBTCPairIndex,
        collateralAmount,
        leverage,
        long
    );

    console.log("fundingFees: ", smallNum(fundingFees, 8));
    console.log("fundingRate: ", fundingRate);
}

async function testOpenMarket(collateralType) {
    const [deployer] = await ethers.getSigners();
    await openMarket(collateralType, deployer.address);
}

async function testTriggerOrder(collateralType) {
    await checkTriggerOrder(
        collateralType,
        2,
        "0x31123fF9c38604cf76F45b181C3A618B3F88ccab",
        0,
        2,
        getProofBytes()
    );
}

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(
        "Testing Tizz Finance Contracts with wallet: ",
        deployer.address
    );

    const collateralType = "WBTC";

    await predictTizzFundingFees(collateralType);
    await syncFundingRate(collateralType, 0);
    await testOpenMarket(collateralType);
    await getTradeFundingFee(collateralType, deployer.address);
    await getTradeLiquidationPrice(collateralType, deployer.address, 0, 0);
    await testTriggerOrder(collateralType);

    console.log("Done");
}

main()
    .then(() => {
        process.exit(1);
    })
    .catch((error) => {
        console.error(error);
    });
