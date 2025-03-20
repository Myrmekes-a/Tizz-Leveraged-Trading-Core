const { ethers } = require("hardhat");
const {
    deployTokens,
    deployAdmin,
    deployCores,
    deployCollaterals,
    initialCoresFirst,
    initialCollateral_1,
    initialCollateral_2,
    initialCoresSecond,
    deployFrontEndInfoAggregator,
    getAddress,
    setFeeUpdator,
} = require("./deployHelper");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(
        "Deploying Tizz Finance Admin contracts with wallet: ",
        deployer.address
    );

    await deployTokens("Global");
    await deployAdmin("Global");
    await deployCores("Global");
    await deployCollaterals("WBTC", deployer);
    await deployCollaterals("USDT", deployer);

    await initialCoresFirst("WBTC", deployer);
    await initialCollateral_1("WBTC");
    await initialCollateral_2("WBTC");

    await initialCoresSecond("USDT", deployer);
    await initialCollateral_1("USDT");
    await initialCollateral_2("USDT");

    await deployFrontEndInfoAggregator("WBTC");
    await deployFrontEndInfoAggregator("USDT");

    await setFeeUpdator("0x31123fF9c38604cf76F45b181C3A618B3F88ccab");

    await deployCollaterals("Native", deployer);
    await initialCoresSecond("Native", deployer);
    await initialCollateral_1("Native");
    await initialCollateral_2("Native");
    await deployFrontEndInfoAggregator("Native");

    await getAddress(["WBTC", "USDT", "Native"], deployer);

    console.log("Deployed successfully!");
}

main()
    .then(() => {
        process.exit(1);
    })
    .catch((error) => {
        console.error(error);
    });
