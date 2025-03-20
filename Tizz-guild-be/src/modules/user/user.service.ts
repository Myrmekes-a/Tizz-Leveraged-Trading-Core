import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { HttpException, HttpStatus } from "@nestjs/common";
import { Web3ConnectService } from "../web3Connect/web3Connect.service";
import { Web3ToolsService } from "../web3Tools/web3Tools.service";
import { HttpService } from "@nestjs/axios";
import { UpdateUserDto } from "./user.dto";
import BigNumber from "bignumber.js";
import { Prisma } from "@prisma/client";

import {
  removeProperties,
  removeEmptyData,
} from "../../utils/remove-properties.util";

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private web3ConnectService: Web3ConnectService,
    private web3ToolsService: Web3ToolsService,
  ) {
    console.log("UserService instantiated");
  }

  async createUser(wallet_address: `0x${string}`) {
    const ensName = await this.web3ToolsService.getEnsName(wallet_address);
    const newUser = await this.prisma.user.create({
      data: {
        wallet_address: wallet_address,
        ensName: ensName,
      },
    });
    return newUser;
  }
  async getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async findUniqueUserByWallet(wallet_address: string) {
    return this.prisma.user.findUnique({
      where: { wallet_address },
    });
  }
  async findUser(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async authenticateUser(
    wallet_address: `0x${string}`,
    signature: `0x${string}`,
    timestamp: number,
  ) {
    let user;
    user = await this.findUniqueUserByWallet(wallet_address);
    const verified = await this.web3ConnectService.verifyWeb3Auth(
      wallet_address,
      signature,
      timestamp,
    );
    if (!verified) {
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);
    }
    if (!user) {
      user = await this.createUser(wallet_address);
      if (!user) {
        throw new HttpException(
          "There was an error while creating the new user",
          HttpStatus.UNAUTHORIZED,
        );
      }
    }
    if (user.is_suspended) {
      throw new HttpException("User is suspended", HttpStatus.FORBIDDEN);
    }
    return user;
  }

  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          wallet_address: true,
          ensName: true,
          role: false,
          is_suspended: true,
          created_at: true,
          updated_at: true,
          rank: false,
          tradingActivities: {
            select: {
              pnl: true,
              volume: true,
              timestamp: true,
              tradeID: true,
            },
          },
          GeneralTradingActivity: {
            select: {
              pnl: true,
              volume: true,
              timestamp: true,
              tradeID: true,
            },
          },
          UserWins: {
            select: {
              wins: true,
              tradeCount: true,
              round: {
                select: {
                  start_time: true,
                  end_time: true,
                },
              },
            },
          },
          UserOverAllWins: {
            select: {
              wins: true,
              tradeCount: true,
            },
          },
        },
      });
      const enrichedUsers = users.map((user) => {
        // Initialize totals using BigNumber
        let totalPnL = new BigNumber(0);
        let totalOverallPnL = new BigNumber(0);
        let totalVolume = new BigNumber(0);
        let totalOverallVolume = new BigNumber(0);
        let totalWins = 0;
        let totalOverAllWins = 0;

        // Calculate totals using BigNumber
        user.tradingActivities.forEach((act) => {
          totalPnL = totalPnL.plus(act.pnl);
          totalVolume = totalVolume.plus(act.volume);
        });

        user.GeneralTradingActivity.forEach((act) => {
          totalOverallPnL = totalOverallPnL.plus(act.pnl);
          totalOverallVolume = totalOverallVolume.plus(act.volume);
        });

        user.UserWins.forEach((win) => {
          totalWins += win.wins;
        });

        user.UserOverAllWins.forEach((win) => {
          totalOverAllWins += win.wins;
        });

        return {
          ...user,
          totalPnL: totalPnL.toString(),
          totalOverallPnL: totalOverallPnL.toString(),
          totalVolume: totalVolume.toString(),
          totalOverallVolume: totalOverallVolume.toString(),
          totalWins: totalWins,
          totalOverAllWins: totalOverAllWins,
          hasTradingActivity: user.GeneralTradingActivity.length > 0,
        };
      });

      // Sort users by total Overall PnL in descending order
      enrichedUsers.sort((a, b) => {
        const aPnL = new BigNumber(a.totalOverallPnL);
        const bPnL = new BigNumber(b.totalOverallPnL);

        const aHasTrades = a.hasTradingActivity;
        const bHasTrades = b.hasTradingActivity;

        // If both users have trading activities, sort by PnL
        if (aHasTrades && bHasTrades) {
          return bPnL.comparedTo(aPnL);
        }

        // If only one user has trading activities, prioritize that user
        if (aHasTrades && !bHasTrades) {
          return -1;
        }
        if (!aHasTrades && bHasTrades) {
          return 1;
        }

        // If neither user has trading activities, they are equal in rank
        return 0;
      });
      // Assign ranks based on sorted order
      const usersWithRank = enrichedUsers.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

      return usersWithRank;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "error while fetching users",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUsers(cursor: number | null = null, pageSize: number = 10) {
    try {
      const users = await this.prisma.user.findMany({
        take: pageSize + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          rank: "asc",
        },
        select: {
          id: true,
          wallet_address: true,
          ensName: true,
          role: false,
          is_suspended: true,
          created_at: true,
          updated_at: true,
          rank: true,
          GeneralTradingActivity: {
            select: {
              pnl: true,
              volume: true,
              timestamp: true,
              tradeID: true,
            },
          },
          tradingActivities: {
            select: {
              pnl: true,
              volume: true,
              timestamp: true,
              tradeID: true,
            },
          },
          UserWins: {
            select: {
              wins: true,
              tradeCount: true,
              pnl: true,
              volume: true,
              round: {
                select: {
                  start_time: true,
                  end_time: true,
                },
              },
            },
          },
        },
      });
      const hasNextPage = users.length > pageSize;
      const edges = hasNextPage ? users.slice(0, -1) : users;

      const enrichedUsers = edges.map((user) => {
        // Initialize totals using BigNumber
        let totalPnL = new BigNumber(0);
        let totalOverallPnL = new BigNumber(0);
        let totalVolume = new BigNumber(0);
        let totalOverallVolume = new BigNumber(0);
        let totalWins = 0;

        // Calculate totals using BigNumber
        user.tradingActivities.forEach((act) => {
          totalPnL = totalPnL.plus(act.pnl);
          totalVolume = totalVolume.plus(act.volume);
        });

        user.GeneralTradingActivity.forEach((act) => {
          totalOverallPnL = totalOverallPnL.plus(act.pnl);
          totalOverallVolume = totalOverallVolume.plus(act.volume);
        });

        user.UserWins.forEach((win) => {
          totalWins += win.wins;
        });

        return {
          ...user,
          totalPnL: totalPnL.toString(),
          totalOverallPnL: totalOverallPnL.toString(),
          totalVolume: totalVolume.toString(),
          totalOverallVolume: totalOverallVolume.toString(),
          totalWins: totalWins,
        };
      });

      return {
        edges: enrichedUsers,
        pageInfo: {
          endCursor: enrichedUsers[enrichedUsers.length - 1]?.id,
          hasNextPage,
        },
      };
    } catch (error) {
      console.error(error);
      throw new HttpException(
        "error while fetching users",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getUserByCondition(where: Prisma.UserWhereUniqueInput) {
    const user = await this.prisma.user.findUnique({
      where,
      select: {
        id: true,
        wallet_address: true,
        ensName: true,
        is_suspended: true,
        rank: true,
        ownedGuilds: {
          select: {
            guild_id: true,
            name: true,
            picture: true,
            created_at: true,
            updated_at: true,
          },
        },
        GeneralTradingActivity: {
          select: {
            pnl: true,
            volume: true,
            timestamp: true,
            tradeID: true,
          },
        },
        tradingActivities: {
          select: {
            pnl: true,
            volume: true,
            timestamp: true,
            tradeID: true,
          },
        },
        guildMembers: {
          select: {
            guild: {
              select: {
                guild_id: true,
                name: true,
                picture: true,
                created_at: true,
                updated_at: true,
              },
            },
            joined_at: true,
            is_active: true,
          },
        },
      },
    });

    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }
    if (user.is_suspended) {
      throw new HttpException("User is suspended", HttpStatus.FORBIDDEN);
    }

    const publicUser = removeProperties(user, ["role"]);

    return publicUser;
  }

  async getUserByWallet(walletAddress: string) {
    try {
      return await this.getUserByCondition({ wallet_address: walletAddress });
    } catch (error) {
      console.error(error);
      throw new HttpException(
        "Error while fetching user by wallet",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getUser(id: number) {
    try {
      return await this.getUserByCondition({ id });
    } catch (error) {
      console.error(error);
      throw new HttpException(
        "Error while fetching user by ID",
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  async updateUser(id: number, data: UpdateUserDto) {
    //remove null or undefined or empty string properties
    const newData = removeEmptyData(data, UpdateUserDto);
    const user = await this.prisma.user.update({
      where: { id },
      data: newData,
    });
    return user;
  }

  async getUserPnL(userId: number) {
    const tradingActivities = await this.prisma.userTradingActivity.findMany({
      where: { user_id: userId },
      select: {
        pnl: true,
        round: {
          select: {
            start_time: true,
            end_time: true,
          },
        },
      },
    });

    const aggregatedPnL = tradingActivities.reduce((accumulator, activity) => {
      return accumulator + parseFloat(activity.pnl);
    }, 0);
    console.log({
      userId: userId,
      totalPnL: aggregatedPnL,
      details: tradingActivities,
    });

    return {
      userId: userId,
      totalPnL: aggregatedPnL,
      details: tradingActivities,
    };
  }

  async getUserWins(userId: number) {
    const tradingActivities = await this.prisma.userWins.findMany({
      where: { user_id: userId },
      select: {
        wins: true,
        tradeCount: true,
        pnl: true,
        volume: true,
        round: {
          select: {
            start_time: true,
            end_time: true,
          },
        },
      },
    });

    const aggregatedWins = tradingActivities.reduce((accumulator, activity) => {
      return accumulator + activity.wins;
    }, 0);

    return {
      userId: userId,
      totalWins: aggregatedWins,
      details: tradingActivities,
    };
  }

  async getUserVolume(userId: number) {
    const tradingActivities = await this.prisma.userTradingActivity.findMany({
      where: { user_id: userId },
      select: {
        volume: true,
        round: {
          select: {
            start_time: true,
            end_time: true,
          },
        },
      },
    });

    const aggregatedVolume = tradingActivities.reduce(
      (accumulator, activity) => {
        return accumulator + parseFloat(activity.volume);
      },
      0,
    );

    return {
      userId: userId,
      totalVolume: aggregatedVolume,
      details: tradingActivities,
    };
  }

  async updateUserRanks() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,

          GeneralTradingActivity: {
            select: {
              pnl: true,
              volume: true,
              timestamp: true,
              tradeID: true,
            },
          },
        },
      });

      const enrichedUsers = users.map((user) => {
        // Initialize totals using BigNumber
        let totalOverallPnL = new BigNumber(0);

        user.GeneralTradingActivity.forEach((act) => {
          totalOverallPnL = totalOverallPnL.plus(act.pnl);
        });

        return {
          ...user,
          totalOverallPnL: totalOverallPnL.toString(),
          hasTradingActivity: user.GeneralTradingActivity.length > 0,
        };
      });

      // Sort users by total Overall PnL in descending order
      enrichedUsers.sort((a, b) => {
        const aPnL = new BigNumber(a.totalOverallPnL);
        const bPnL = new BigNumber(b.totalOverallPnL);

        const aHasTrades = a.hasTradingActivity;
        const bHasTrades = b.hasTradingActivity;

        // If both users have trading activities, sort by PnL
        if (aHasTrades && bHasTrades) {
          return bPnL.comparedTo(aPnL);
        }

        // If only one user has trading activities, prioritize that user
        if (aHasTrades && !bHasTrades) {
          return -1;
        }
        if (!aHasTrades && bHasTrades) {
          return 1;
        }

        // If neither user has trading activities, they are equal in rank
        return 0;
      });
      // Update rank for each user
      await Promise.all(
        enrichedUsers.map((user, index) => {
          return this.prisma.user.update({
            where: { id: user.id },
            data: { rank: index + 1 },
          });
        }),
      );

      return true;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        "Internal Server Error",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //

  async storeRefreshToken(
    userId: number,
    refreshToken: string,
    expiresAt: Date,
  ) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });
  }

  async validateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<boolean> {
    const token = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        token: refreshToken,
        expiresAt: {
          gte: new Date(),
        },
      },
    });

    return !!token;
  }

  async invalidateRefreshToken(userId: number, refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });
  }
}
