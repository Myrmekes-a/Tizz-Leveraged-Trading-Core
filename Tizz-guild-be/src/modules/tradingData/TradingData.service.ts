import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
// import { formatUnits } from "viem";
import BigNumber from "bignumber.js";
import { collateralPrecision, usdPrecision } from "../../utils/tools";

import { PrismaService } from "../prisma/prisma.service"; // Assuming you have a Prisma service for DB operations
import { WinsType, TradeData } from "../../utils/types/trade-types.type";

@Injectable()
export class TradingDataService {
  constructor(
    private httpService: HttpService,
    private prismaService: PrismaService,
  ) { }


  private backendUrl = process.env.Backend_URL;



  async fetchAndStoreUserWins(): Promise<void> {
    try {
      const users = await this.prismaService.user.findMany();
      const userWalletMapping = users.map((user) => ({
        userId: user.id,
        walletAddress: user.wallet_address,
      }));

      const endTime = new Date(new Date().getTime() + 20 * 60000);
      const activeRounds = await this.prismaService.tradingRounds.findMany({
        where: {
          start_time: { lte: new Date() },
          end_time: { gte: endTime },
        },
      });

      for (const round of activeRounds) {
        for (let i = 0; i < userWalletMapping.length; i += 50) {
          const batch = userWalletMapping.slice(i, i + 50);
          const walletAddresses = batch.map(
            ({ walletAddress }) => walletAddress,
          );
          const response = await this.httpService
            .post(
              `${this.backendUrl}/trades/winner`,
              {
                addresses: walletAddresses,
                start: round.start_time,
                end: round.end_time,
              },
              {
                headers: {
                  "Content-Type": "text/plain",
                },
              },
            )
            .toPromise();
          const tradingData: WinsType = JSON.parse(response.data.data);

          for (const data of Object.values(tradingData)) {
            const user = batch.find((u) => u.walletAddress === data.address);
            if (user) {
              // const volume = new BigNumber(data.size)
              //   .multipliedBy(data.collateralPriceUsd)
              //   .dividedBy(collateralPrecision[data.collateral])
              //   .dividedBy(usdPrecision);
              // const pnl = new BigNumber(data.pnl)
              //   .multipliedBy(data.collateralPriceUsd)
              //   .dividedBy(collateralPrecision[data.collateral])
              //   .dividedBy(usdPrecision);


              const formattedVolume = new BigNumber(data.size).toString();
              const formattedPnl = new BigNumber(data.pnl).toString()
              await this.prismaService.userWins.upsert({
                where: {
                  user_round_unique: {
                    user_id: user.userId,
                    round_id: round.round_id,
                  },
                },
                update: {
                  wins: data.wins,
                  tradeCount: data.tradeCount,
                  pnl: formattedPnl,
                  volume: formattedVolume,
                },
                create: {
                  user_id: user.userId,
                  round_id: round.round_id,
                  wins: data.wins,
                  tradeCount: data.tradeCount,
                  pnl: formattedPnl,
                  volume: formattedVolume,
                },
              });
            }
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Pause for 1 second between batches
      }
    } catch (error) {
      console.error("Failed to fetch or save user wins data", error);
      throw new Error("Failed to process user wins data");
    }
  }

  async fetchAndStoreAllUserWins(): Promise<void> {
    try {
      // Fetch the last processed timestamp
      const lastProcessedTimestampRecord =
        await this.prismaService.lastProcessedTimestamp.findFirst();

      const users = await this.prismaService.user.findMany();
      const userWalletMapping = users.map((user) => ({
        userId: user.id,
        walletAddress: user.wallet_address,
      }));

      // Fetch trades starting from the last processed timestamp
      const currentTimestamp = new Date();
      for (let i = 0; i < userWalletMapping.length; i += 250) {
        const batch = userWalletMapping.slice(i, i + 250);
        const walletAddresses = batch.map(({ walletAddress }) => walletAddress);
        const response = await this.httpService
          .post(
            `${this.backendUrl}/trades/winner`,
            JSON.stringify({
              addresses: walletAddresses,
            }),
            {
              headers: {
                "Content-Type": "application/json",
              },
            },
          )
          .toPromise();

        const tradingData: WinsType = JSON.parse(response.data.data);
        for (const data of Object.values(tradingData)) {
          const user = batch.find((u) => u.walletAddress === data.address);
          if (user) {
            // const volume = new BigNumber(data.size)
            //   .multipliedBy(data.collateralPriceUsd)
            //   .dividedBy(collateralPrecision[data.collateral])
            //   .dividedBy(usdPrecision);
            // const pnl = new BigNumber(data.pnl)
            //   .multipliedBy(data.collateralPriceUsd)
            //   .dividedBy(collateralPrecision[data.collateral])
            //   .dividedBy(usdPrecision);

            const formattedVolume = new BigNumber(data.size).toString();
            const formattedPnl = new BigNumber(data.pnl).toString()
            const existingWin =
              await this.prismaService.userOverAllWins.findUnique({
                where: {
                  user_id: user.userId,
                },
              });

            if (!existingWin) {
              await this.prismaService.userOverAllWins.create({
                data: {
                  user_id: user.userId,
                  wins: data.wins,
                  tradeCount: data.tradeCount,
                  pnl: formattedPnl,
                  volume: formattedVolume,
                },
              });
            } else {
              await this.prismaService.userOverAllWins.update({
                where: {
                  user_id: user.userId,
                },
                data: {
                  wins: data.wins,
                  tradeCount: data.tradeCount,
                  pnl: formattedPnl,
                  volume: formattedVolume,
                },
              });
            }
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Pause for 1 second between batches
      }

      // Update the last processed timestamp
      if (lastProcessedTimestampRecord) {
        await this.prismaService.lastProcessedTimestamp.update({
          where: { id: lastProcessedTimestampRecord.id },
          data: { timeStampUserWins: currentTimestamp },
        });
      } else {
        await this.prismaService.lastProcessedTimestamp.create({
          data: { timeStampUserWins: currentTimestamp },
        });
      }
    } catch (error) {
      console.error("Failed to fetch or save user wins data", error);
      throw new Error("Failed to process user wins data");
    }
  }

  async fetchAndStoreTradeData(): Promise<void> {
    const users = await this.prismaService.user.findMany();
    const userWalletMapping = users.map((user) => ({
      userId: user.id,
      walletAddress: user.wallet_address,
    }));

    const endTime = new Date(new Date().getTime() + 20 * 60000);
    const activeRounds = await this.prismaService.tradingRounds.findMany({
      where: {
        start_time: { lte: new Date() },
        end_time: { gte: endTime },
      },
    });

    for (const round of activeRounds) {
      for (let i = 0; i < userWalletMapping.length; i += 50) {
        const batch = userWalletMapping.slice(i, i + 50);
        const walletAddresses = batch.map(({ walletAddress }) => walletAddress);
        const response = await this.httpService
          .post(
            `${this.backendUrl}/trades`,
            {
              addresses: walletAddresses,
              start: round.start_time,
              end: round.end_time,
            },
            {
              headers: {
                "Content-Type": "text/plain",
              },
            },
          )
          .toPromise();
        const tradingData: TradeData = response.data;

        for (const data of Object.values(tradingData.data)) {
          const user = batch.find((u) => u.walletAddress === data.trader);
          if (user) {
            const volume = new BigNumber(data.size)
              .multipliedBy(data.collateralPriceUsd)
              .dividedBy(collateralPrecision[data.collateral])
              .dividedBy(usdPrecision);
            const pnl = new BigNumber(data.pnl)
              .multipliedBy(data.collateralPriceUsd)
              .dividedBy(collateralPrecision[data.collateral])
              .dividedBy(usdPrecision);

            const formattedVolume = volume.toString();
            const formattedPnl = pnl.toString()
            await this.prismaService.userTradingActivity.create({
              data: {
                user_id: user.userId,
                round_id: round.round_id,
                volume: formattedVolume,
                pnl: formattedPnl,
                leverage: data.leverage,
                collateralPriceUsd: parseFloat(data.collateralPriceUsd),
                pair: data.pair,
                timestamp: new Date(data.timestamp),
                type: data.buy === 1 ? "buy" : "sell",
                points: 0,
                tradeID: data._id,
              },
            });
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Pause for 1 second between batches
    }
  }

  async fetchAndStoreAllTradeData(): Promise<void> {
    try {
      // Fetch the last processed timestamp
      const lastProcessedTimestampRecord =
        await this.prismaService.lastProcessedTimestamp.findFirst();
      const lastProcessedTimestamp = lastProcessedTimestampRecord
        ? lastProcessedTimestampRecord.timestamp
        : new Date(0);

      const users = await this.prismaService.user.findMany();
      const userWalletMapping = users.map((user) => ({
        userId: user.id,
        walletAddress: user.wallet_address,
      }));

      // Fetch trades starting from the last processed timestamp
      const currentTimestamp = new Date();
      for (let i = 0; i < userWalletMapping.length; i += 250) {
        const batch = userWalletMapping.slice(i, i + 250);
        const walletAddresses = batch.map(({ walletAddress }) => walletAddress);
        const response = await this.httpService
          .post(
            `${this.backendUrl}/trades`,
            {
              addresses: walletAddresses,
              start: lastProcessedTimestamp.toISOString(),
              end: currentTimestamp.toISOString(),
            },
            {
              headers: {
                "Content-Type": "text/plain",
              },
            },
          )
          .toPromise();

        const tradingData: TradeData = response.data;

        for (const data of Object.values(tradingData.data)) {
          const user = batch.find((u) => u.walletAddress === data.trader);
          if (user) {
            const volume = new BigNumber(data.size)
              .multipliedBy(data.collateralPriceUsd)
              .dividedBy(collateralPrecision[data.collateral])
              .dividedBy(usdPrecision);
            const pnl = new BigNumber(data.pnl)
              .multipliedBy(data.collateralPriceUsd)
              .dividedBy(collateralPrecision[data.collateral])
              .dividedBy(usdPrecision);

            const formattedVolume = volume.toString();
            const formattedPnl = pnl.toString()
            const existingTrade =
              await this.prismaService.userGeneralTradingActivity.findUnique({
                where: { tradeID: data._id },
              });

            if (!existingTrade) {
              await this.prismaService.userGeneralTradingActivity.create({
                data: {
                  user_id: user.userId,
                  volume: formattedVolume,
                  pnl: formattedPnl,
                  leverage: data.leverage,
                  pair: data.pair,
                  timestamp: new Date(data.timestamp),
                  type: data.buy === 1 ? "buy" : "sell",
                  points: 0,
                  tradeID: data._id,
                },
              });
            }
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Pause for 1 second between batches
      }

      // Update the last processed timestamp
      if (lastProcessedTimestampRecord) {
        await this.prismaService.lastProcessedTimestamp.update({
          where: { id: lastProcessedTimestampRecord.id },
          data: { timestamp: currentTimestamp },
        });
      } else {
        await this.prismaService.lastProcessedTimestamp.create({
          data: { timestamp: currentTimestamp },
        });
      }
      console.log("Successfully fetched and stored all trade data");
    } catch (error) {
      console.error("Failed to fetch or save user trading data", error);
      throw new Error("Failed to process user trading data");
    }
  }



}
