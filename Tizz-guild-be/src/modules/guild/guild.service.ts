import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { HttpException, HttpStatus } from "@nestjs/common";
import { Web3ConnectService } from "../web3Connect/web3Connect.service";
import { Web3ToolsService } from "../web3Tools/web3Tools.service";
import { HttpService } from "@nestjs/axios";
import { Guild as PrismaGuild, GuildMembers } from "@prisma/client";
import BigNumber from "bignumber.js";

import {
  //   removeProperties,
  removeEmptyData,
} from "../../utils/remove-properties.util";

import { CreateGuildDto } from "./guild.dto";

interface ExtendedGuildMembers extends GuildMembers {
  user?: {
    wallet_address: string;
  };
}
interface ExtendedGuild extends PrismaGuild {
  totalPnL?: string;
  totalOverAllPnL?: string;
  totalVolume?: string;
  totalOverAllVolume?: string;
  totalWins?: number;
  guildMembers: ExtendedGuildMembers[];
  totalTrades?: number;
  totalOverAllWins?: number;
}

@Injectable()
export class GuildService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private web3ConnectService: Web3ConnectService,
    private web3ToolsService: Web3ToolsService,
  ) {
    console.log("GuildService instantiated");
  }

  // async getGuilds() {
  //   return this.prisma.guild.findMany();
  // }

  async getAllGuilds() {
    try {
      const guilds = (await this.prisma.guild.findMany({
        include: {
          guildMembers: {
            select: {
              user_id: true,
              user: {
                select: {
                  wallet_address: true,
                },
              },
            },
          },
        },
      })) as ExtendedGuild[];

      // Aggregate PnL and volume for each guild
      for (const guild of guilds) {
        const guildMemberIds = guild.guildMembers.map(
          (member) => member.user_id,
        );
        const userWins = await this.prisma.userWins.findMany({
          where: {
            user_id: { in: guildMemberIds },
          },
          select: {
            pnl: true,
            volume: true,
            wins: true,
          },
        });
        const overAll = await this.prisma.userGeneralTradingActivity.findMany({
          where: {
            user_id: { in: guildMemberIds },
          },
          select: {
            pnl: true,
            volume: true,
          },
        });
        const userTrades = overAll.length;

        guild.totalTrades = userTrades;

        // Initialize totals using BigNumber
        let totalPnL = new BigNumber(0);
        let totalOverAllPnL = new BigNumber(0);
        let totalVolume = new BigNumber(0);
        let totalOverAllVolume = new BigNumber(0);

        // Calculate totals using BigNumber
        userWins.forEach((win) => {
          totalPnL = totalPnL.plus(win.pnl);
          totalVolume = totalVolume.plus(win.volume);
        });

        overAll.forEach((trade) => {
          totalOverAllPnL = totalOverAllPnL.plus(trade.pnl);
          totalOverAllVolume = totalOverAllVolume.plus(trade.volume);
        });

        guild.totalPnL = totalPnL.toString();
        guild.totalOverAllPnL = totalOverAllPnL.toString();
        guild.totalVolume = totalVolume.toString();
        guild.totalOverAllVolume = totalOverAllVolume.toString();
        guild.totalWins = userWins.reduce((acc, curr) => acc + curr.wins, 0);

        const overAllUserWins = await this.prisma.userOverAllWins.findMany({
          where: {
            user_id: {
              in: guildMemberIds,
            },
          },
        });

        const guildOverAllWins = overAllUserWins.reduce(
          (acc, curr) => acc + curr.wins,
          0,
        );

        guild.totalOverAllWins = guildOverAllWins;
      }

      // Sort guilds by totalOverAllPnL in descending order and assign ranks
      guilds.sort((a, b) =>
        new BigNumber(b.totalOverAllPnL)
          .minus(new BigNumber(a.totalOverAllPnL))
          .toNumber(),
      );

      guilds.forEach((guild, index) => {
        guild.rank = index + 1;
      });

      // Remove user field from guildMembers in the final results
      const sanitizedGuilds = guilds.map((guild) => ({
        ...guild,
        guildMembers: guild.guildMembers.map((member) => ({
          user_id: member.user_id,
          wallet_address: member.user.wallet_address, // Include as intermediate processing
        })),
      }));

      return sanitizedGuilds;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to fetch guilds",
        error.status || error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
  async getGuilds(cursor: number | null = null, pageSize: number = 10) {
    try {
      const guilds = (await this.prisma.guild.findMany({
        take: pageSize,
        cursor: cursor ? { guild_id: cursor } : undefined,

        include: {
          guildMembers: {
            select: {
              user_id: true,
            },
          },
        },
      })) as ExtendedGuild[];

      // Determine if there is a next page
      const hasNextPage = guilds.length > pageSize;
      const normalizedGuilds = hasNextPage ? guilds.slice(0, -1) : guilds;

      // Aggregate PnL and volume for each guild
      for (const guild of normalizedGuilds) {
        const guildMemberIds = guild.guildMembers.map(
          (member) => member.user_id,
        );
        const userWins = await this.prisma.userWins.findMany({
          where: {
            user_id: { in: guildMemberIds },
          },
          select: {
            pnl: true,
            volume: true,
            wins: true,
          },
        });

        const overAll = await this.prisma.userGeneralTradingActivity.findMany({
          where: {
            user_id: { in: guildMemberIds },
          },
          select: {
            pnl: true,
            volume: true,
          },
        });
        const userTrades = overAll.length;
        guild.totalTrades = userTrades;
        // Initialize totals using BigNumber
        let totalPnL = new BigNumber(0);
        let totalOverAllPnL = new BigNumber(0);
        let totalVolume = new BigNumber(0);
        let totalOverAllVolume = new BigNumber(0);

        // Calculate totals using BigNumber
        userWins.forEach((win) => {
          totalPnL = totalPnL.plus(win.pnl);
          totalVolume = totalVolume.plus(win.volume);
        });

        overAll.forEach((trade) => {
          totalOverAllPnL = totalOverAllPnL.plus(trade.pnl);
          totalOverAllVolume = totalOverAllVolume.plus(trade.volume);
        });

        guild.totalPnL = totalPnL.toString();
        guild.totalOverAllPnL = totalOverAllPnL.toString();
        guild.totalVolume = totalVolume.toString();
        guild.totalOverAllVolume = totalOverAllVolume.toString();
        guild.totalWins = userWins.reduce((acc, curr) => acc + curr.wins, 0);
        const overAllUserWins = await this.prisma.userOverAllWins.findMany({
          where: {
            user_id: {
              in: guildMemberIds,
            },
          },
        });
        const guildOverAllWins = overAllUserWins.reduce(
          (acc, curr) => acc + curr.wins,
          0,
        );
        guild.totalOverAllWins = guildOverAllWins;
      }

      // Sort guilds by totalOverAllPnL in descending order and assign ranks
      normalizedGuilds.sort((a, b) =>
        new BigNumber(b.totalOverAllPnL)
          .minus(new BigNumber(a.totalOverAllPnL))
          .toNumber(),
      );

      normalizedGuilds.forEach((guild, index) => {
        guild.rank = index + 1;
      });

      return {
        guilds: normalizedGuilds,
        hasNextPage,
        endCursor: hasNextPage
          ? normalizedGuilds[normalizedGuilds.length - 1].guild_id
          : null,
      };
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to fetch guilds",
        error.status || error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getGuild(guild_id: number) {
    try {
      const guild = await this.prisma.guild.findUnique({
        where: {
          guild_id,
        },
        include: {
          guildMembers: {
            select: {
              guild: {
                select: {
                  guild_id: true,
                  name: true,
                  picture: true,
                  created_at: false,
                  updated_at: false,
                },
              },
              joined_at: true,
              is_active: true,
              user_id: true,
              user: {
                select: {
                  wallet_address: true,
                },
              },
            },
          },
        },
      });
      // Separately aggregate P&L and trading volume for the guild
      const guildMemebers = guild.guildMembers.map((member) => member.user_id);
      const userWins = await this.prisma.userWins.findMany({
        where: {
          user_id: {
            in: guildMemebers,
          },
        },
      });
      const overAllUserWins = await this.prisma.userOverAllWins.findMany({
        where: {
          user_id: {
            in: guildMemebers,
          },
        },
      });
      const overAll = await this.prisma.userGeneralTradingActivity.findMany({
        where: {
          user_id: {
            in: guildMemebers,
          },
        },
      });
      const userTrades = overAll.length;
      // Initialize totals using BigNumber
      let guildPnL = new BigNumber(0);
      let guildOverAllPnL = new BigNumber(0);
      let guildVolume = new BigNumber(0);
      let guildOverAllVolume = new BigNumber(0);
      let guildWins = 0;
      let guildOverAllWins = 0;

      // Calculate totals using BigNumber
      userWins.forEach((win) => {
        guildPnL = guildPnL.plus(win.pnl);
        guildVolume = guildVolume.plus(win.volume);
        guildWins += win.wins;
      });

      overAll.forEach((trade) => {
        guildOverAllPnL = guildOverAllPnL.plus(trade.pnl);
        guildOverAllVolume = guildOverAllVolume.plus(trade.volume);
      });

      overAllUserWins.forEach((win) => {
        guildOverAllWins += win.wins;
      });

      return {
        ...guild,
        tradingVolume: guildVolume,
        tradingOverAllVolume: guildOverAllVolume,
        totalPnL: guildPnL,
        totalOverAllPnL: guildOverAllPnL,
        totalWins: guildWins,
        totalTrades: userTrades,
        totalOverAllWins: guildOverAllWins,
        guildMembers: guild.guildMembers.map((member) => ({
          guild: member.guild,
          joined_at: member.joined_at,
          is_active: member.is_active,
          user_id: member.user_id,
          wallet_address: member.user.wallet_address,
        })),
      };
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to fetch guild",
        error.status || error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
  async createGuild(guild_data: CreateGuildDto, owner_user_id: number) {
    try {
      const guildMember = await this.prisma.guildMembers.findFirst({
        where: {
          user_id: owner_user_id,
        },
      });
      if (guildMember) {
        throw new HttpException(
          "User is already a member of a guild",
          HttpStatus.BAD_REQUEST,
        );
      }
      // check if guild name already exists
      const guild = await this.prisma.guild.findUnique({
        where: {
          name: guild_data.name,
        },
      });
      if (guild) {
        throw new HttpException(
          "Guild name already exists",
          HttpStatus.BAD_REQUEST,
        );
      }
      const guildData = removeEmptyData(
        guild_data,
        CreateGuildDto,
      ) as CreateGuildDto;
      // create guild
      const new_guild = await this.prisma.guild.create({
        data: {
          ...guildData,
          owner_user_id,
          guildMembers: {
            create: {
              user_id: owner_user_id,
              is_active: true,
              joined_at: new Date(),
            },
          },
        },
      });
      return new_guild;
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to create guild",
        error.status || error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async removeGuild(guild_id: number, owner_user_id: number) {
    try {
      // check if user is owner of guild
      const owner = await this.prisma.guild.findUnique({
        where: {
          guild_id: guild_id,
          owner_user_id: owner_user_id,
        },
      });
      if (!owner) {
        throw new HttpException(
          "User is not owner of guild",
          HttpStatus.BAD_REQUEST,
        );
      }
      // remove guild
      const deleted_guild = await this.prisma.guild.delete({
        where: {
          guild_id,
        },
      });
      return deleted_guild;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to remove guild",
        error.status || error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updateGuild(
    guild_id: number,
    guild_data: CreateGuildDto,
    owner_user_id: number,
  ) {
    try {
      // check if user is owner of guild
      const owner = await this.prisma.guild.findUnique({
        where: {
          guild_id: guild_id,
          owner_user_id: owner_user_id,
        },
      });
      if (!owner) {
        throw new HttpException(
          "User is not owner of guild",
          HttpStatus.BAD_REQUEST,
        );
      }
      const guildData = removeEmptyData(
        guild_data,
        CreateGuildDto,
      ) as CreateGuildDto;

      // update guild
      const updated_guild = await this.prisma.guild.update({
        where: {
          guild_id: guild_id,
        },
        data: {
          ...guildData,
        },
      });
      return updated_guild;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to update guild",
        error.status || error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
  async acceptJoinRequest(actionId: number, ownerId: number) {
    try {
      // Fetch the action
      const action = await this.prisma.guildMembershipActions.findUnique({
        where: { action_id: actionId },
      });
      //check if the user is the owner of the guild
      const guild = await this.prisma.guild.findUnique({
        where: {
          guild_id: action.guild_id,
        },
      });
      if (guild.owner_user_id !== ownerId) {
        throw new HttpException(
          "User is not the owner of the guild",
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        action &&
        action.action_type === "REQUEST_TO_JOIN" &&
        action.status === "PENDING"
      ) {
        const guildMember = await this.prisma.guildMembers.findFirst({
          where: {
            user_id: action.user_id,
          },
        });
        if (guildMember) {
          throw new HttpException(
            "User is already a member of a guild",
            HttpStatus.BAD_REQUEST,
          );
        }
        // Update the action status to ACCEPTED
        await this.prisma.guildMembershipActions.update({
          where: { action_id: actionId },
          data: { status: "ACCEPTED", updated_at: new Date() },
        });

        // Ensure the user is added to the guild members
        await this.prisma.guildMembers.upsert({
          where: {
            guild_id_user_id: {
              guild_id: action.guild_id,
              user_id: action.user_id,
            },
          },
          update: { is_active: true },
          create: {
            guild_id: action.guild_id,
            user_id: action.user_id,
            is_active: true,
            joined_at: new Date(),
          },
        });
      } else {
        throw new HttpException(
          "Join request not found or not eligible for acceptance.",
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to accept join request",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async rejectJoinRequest(actionId: number, ownerId: number) {
    try {
      // Fetch the action
      const action = await this.prisma.guildMembershipActions.findUnique({
        where: { action_id: actionId },
      });

      //check if the user is the owner of the guild
      const guild = await this.prisma.guild.findUnique({
        where: {
          guild_id: action.guild_id,
        },
      });
      if (guild.owner_user_id !== ownerId) {
        throw new HttpException(
          "User is not the owner of the guild",
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        action &&
        action.action_type === "REQUEST_TO_JOIN" &&
        action.status === "PENDING"
      ) {
        // Update the action status to REJECTED
        await this.prisma.guildMembershipActions.update({
          where: { action_id: actionId },
          data: { status: "REJECTED", updated_at: new Date() },
        });
      } else {
        throw new HttpException(
          "Join request not found or not eligible for rejection.",
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to reject join request",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createJoinRequest(guildId: number, userId: number) {
    try {
      // check if the user is a memebr or owner of a guild
      const guildMember = await this.prisma.guildMembers.findFirst({
        where: {
          user_id: userId,
        },
      });
      if (guildMember) {
        throw new HttpException(
          "User is already a member of a guild",
          HttpStatus.BAD_REQUEST,
        );
      }
      const guildOwner = await this.prisma.guild.findFirst({
        where: {
          owner_user_id: userId,
        },
      });
      if (guildOwner) {
        throw new HttpException(
          "User is already an owner of a guild",
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if the user has an existing pending join request or invitation
      const existingPendingRequest =
        await this.prisma.guildMembershipActions.findFirst({
          where: {
            guild_id: guildId,
            user_id: userId,
            status: "PENDING",
          },
        });

      if (existingPendingRequest) {
        throw new HttpException(
          "User already has a pending join or invitation request.",
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create a new join request
      const newRequest = await this.prisma.guildMembershipActions.create({
        data: {
          guild_id: guildId,
          user_id: userId,
          action_type: "REQUEST_TO_JOIN",
          status: "PENDING",
          initiated_by_id: userId,
        },
      });

      return newRequest;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to create join request",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendInvitationRequest(
    guildId: number,
    userId: number,
    ownerId: number,
  ) {
    try {
      // Check if the user has an existing pending join request or invitation
      const existingPendingRequest =
        await this.prisma.guildMembershipActions.findFirst({
          where: {
            guild_id: guildId,
            user_id: userId,
            status: "PENDING",
          },
        });

      if (existingPendingRequest) {
        throw new HttpException(
          "User already has a pending join or invitation request.",
          HttpStatus.BAD_REQUEST,
        );
      }
      // check if the owner is the owner of the guild
      const guild = await this.prisma.guild.findUnique({
        where: {
          guild_id: guildId,
        },
      });
      if (guild.owner_user_id !== ownerId) {
        throw new HttpException(
          "User is not the owner of the guild",
          HttpStatus.BAD_REQUEST,
        );
      }
      // Check if the user is already a member of a guild
      const existingMember = await this.prisma.guildMembers.findFirst({
        where: {
          user_id: userId,
        },
      });

      if (existingMember) {
        throw new HttpException(
          "User is already a member of a guild",
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create a new invitation request
      const newRequest = await this.prisma.guildMembershipActions.create({
        data: {
          guild_id: guildId,
          user_id: userId,
          action_type: "INVITATION",
          status: "PENDING",
          initiated_by_id: ownerId,
        },
      });
      return newRequest;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to send invitation request",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendInvitationRequestByAddress(
    guildId: number,
    address: string,
    ownerId: number,
  ) {
    try {
      // check if the owner is the owner of the guild

      const guild = await this.prisma.guild.findUnique({
        where: {
          guild_id: guildId,
        },
      });
      if (guild.owner_user_id !== ownerId) {
        throw new HttpException(
          "User is not the owner of the guild",
          HttpStatus.BAD_REQUEST,
        );
      }

      // Fetch the user ID associated with the provided address
      const user = await this.prisma.user.findFirst({
        where: {
          wallet_address: address,
        },
      });

      if (!user) {
        throw new HttpException("User not found", HttpStatus.BAD_REQUEST);
      }

      // Check if the user is already a member of a guild

      const existingMember = await this.prisma.guildMembers.findFirst({
        where: {
          user_id: user.id,
        },
      });

      if (existingMember) {
        throw new HttpException(
          "User is already a member of a guild",
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if the user has an existing pending join request or invitation

      const existingPendingRequest =
        await this.prisma.guildMembershipActions.findFirst({
          where: {
            guild_id: guildId,
            user_id: user.id,
            status: "PENDING",
          },
        });

      if (existingPendingRequest) {
        throw new HttpException(
          "User already has a pending join or invitation request.",
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create a new invitation request

      const newRequest = await this.prisma.guildMembershipActions.create({
        data: {
          guild_id: guildId,
          user_id: user.id,
          action_type: "INVITATION",
          status: "PENDING",
          initiated_by_id: ownerId,
        },
      });

      return newRequest;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to send invitation request",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async acceptInvitationRequest(actionId: number, userId: number) {
    try {
      const guildMember = await this.prisma.guildMembers.findFirst({
        where: {
          user_id: userId,
        },
      });
      if (guildMember) {
        throw new HttpException(
          "User is already a member of a guild",
          HttpStatus.BAD_REQUEST,
        );
      }
      // Fetch the action
      const action = await this.prisma.guildMembershipActions.findUnique({
        where: { action_id: actionId, user_id: userId },
      });
      if (
        action &&
        action.action_type === "INVITATION" &&
        action.status === "PENDING"
      ) {
        // Update the action status to ACCEPTED
        await this.prisma.guildMembershipActions.update({
          where: { action_id: actionId },
          data: { status: "ACCEPTED", updated_at: new Date() },
        });
        // Ensure the user is added to the guild members
        await this.prisma.guildMembers.upsert({
          where: {
            guild_id_user_id: {
              guild_id: action.guild_id,
              user_id: action.user_id,
            },
          },
          update: { is_active: true },
          create: {
            guild_id: action.guild_id,
            user_id: action.user_id,
            is_active: true,
            joined_at: new Date(),
          },
        });
      } else {
        throw new HttpException(
          "Invitation request not found or not eligible for acceptance.",
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to accept invitation request",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async rejectInvitationRequest(actionId: number, userId: number) {
    try {
      // Fetch the action
      const action = await this.prisma.guildMembershipActions.findUnique({
        where: { action_id: actionId, user_id: userId },
      });
      if (
        action &&
        action.action_type === "INVITATION" &&
        action.status === "PENDING"
      ) {
        // Update the action status to REJECTED
        await this.prisma.guildMembershipActions.update({
          where: { action_id: actionId },
          data: { status: "REJECTED", updated_at: new Date() },
        });
      } else {
        throw new HttpException(
          "Invitation request not found or not eligible for rejection.",
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to reject invitation request",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserInvitationRequests(userId: number) {
    try {
      const invitations = await this.prisma.guildMembershipActions.findMany({
        where: {
          user_id: userId,
          action_type: "INVITATION",
        },
      });
      return invitations;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        "Failed to fetch user invitation requests",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getGuildJoinRequests(guildId: number, ownerId: number) {
    try {
      //check if the user is the owner of the guild
      const guild = await this.prisma.guild.findUnique({
        where: {
          guild_id: guildId,
        },
      });
      if (guild.owner_user_id !== ownerId) {
        throw new HttpException(
          "User is not the owner of the guild",
          HttpStatus.BAD_REQUEST,
        );
      }
      const joinRequests = await this.prisma.guildMembershipActions.findMany({
        where: {
          guild_id: guildId,
          action_type: "REQUEST_TO_JOIN",
        },
      });
      return joinRequests;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to fetch guild join requests",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async leaveGuild(guild_id: number, user_id: number) {
    try {
      // check if user is in guild
      const members = await this.prisma.guildMembers.findFirst({
        where: {
          guild_id: guild_id,
          user_id: user_id,
        },
      });
      if (!members) {
        throw new HttpException("User is not in guild", HttpStatus.BAD_REQUEST);
      }
      // check if user is the guild owner
      const guild = await this.prisma.guild.findUnique({
        where: {
          guild_id: guild_id,
        },
      });
      if (guild.owner_user_id === user_id) {
        throw new HttpException(
          "User is the owner of the guild, transfer ownership before leaving",
          HttpStatus.BAD_REQUEST,
        );
      }
      // leave guild
      const deleted_member = await this.prisma.guildMembers.delete({
        where: {
          guild_member_id: members.guild_member_id,
        },
      });
      return deleted_member;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message || "Failed to leave guild",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async removeMember(guild_id: number, user_id: number, owner_id: number) {
    try {
      // check if user is owner of guild
      const owner = await this.prisma.guild.findUnique({
        where: {
          guild_id: guild_id,
          owner_user_id: owner_id,
        },
      });
      if (!owner) {
        throw new HttpException(
          "User is not owner of guild",
          HttpStatus.BAD_REQUEST,
        );
      }
      // check if user is in guild
      const members = await this.prisma.guildMembers.findFirst({
        where: {
          guild_id: guild_id,
          user_id: user_id,
        },
      });
      if (!members) {
        throw new HttpException("User is not in guild", HttpStatus.BAD_REQUEST);
      }
      // remove member from guild
      const deleted_member = await this.prisma.guildMembers.delete({
        where: {
          guild_member_id: members.guild_member_id,
        },
      });
      return deleted_member;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message || "Failed to remove member from guild",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async transferOwnership(
    guild_id: number,
    user_id: number,
    new_owner_id: number,
  ) {
    try {
      // check if user is owner of guild
      const owner = await this.prisma.guild.findUnique({
        where: {
          guild_id: guild_id,
          owner_user_id: user_id,
        },
      });
      if (!owner) {
        throw new HttpException(
          "User is not owner of guild",
          HttpStatus.BAD_REQUEST,
        );
      }
      // check if new owner is in guild
      const members = await this.prisma.guildMembers.findFirst({
        where: {
          guild_id: guild_id,
          user_id: new_owner_id,
        },
      });
      if (!members) {
        throw new HttpException(
          "New owner is not in guild",
          HttpStatus.BAD_REQUEST,
        );
      }
      // transfer ownership
      const updated_guild = await this.prisma.guild.update({
        where: {
          guild_id: guild_id,
        },
        data: {
          owner_user_id: new_owner_id,
        },
      });
      return updated_guild;
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message || "Failed to transfer ownership",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createOwnershipTransfer(
    guildId: number,
    newOwnerId: number,
    oldOwnerId: number,
  ) {
    try {
      //check if the owner is the owner of the guild
      const guild = await this.prisma.guild.findUnique({
        where: {
          guild_id: guildId,
        },
      });
      if (guild.owner_user_id !== oldOwnerId) {
        throw new HttpException(
          "User is not the owner of the guild",
          HttpStatus.BAD_REQUEST,
        );
      }
      const existingPendingTransfer =
        await this.prisma.guildOwnershipTransfers.findFirst({
          where: {
            guild_id: guildId,
            status: "PENDING",
          },
        });

      if (existingPendingTransfer) {
        throw new HttpException(
          "A pending transfer already exists for this guild.",
          HttpStatus.BAD_REQUEST,
        );
      }

      // No existing pending transfer, proceed to create a new transfer request
      const newTransfer = await this.prisma.guildOwnershipTransfers.create({
        data: {
          guild_id: guildId,
          old_owner_id: oldOwnerId,
          new_owner_id: newOwnerId,
          status: "PENDING", // Default value
        },
      });

      return newTransfer;
    } catch (error) {
      console.error(error);
      console.log(error.status);
      // throw orr or return error
      throw new HttpException(
        error.message || "Failed to create ownership transfer",
        error.status || error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async acceptOwnershipTransfer(transferId: number, newOwnerId: number) {
    try {
      const transfer = await this.prisma.guildOwnershipTransfers.findUnique({
        where: {
          transfer_id: transferId,
        },
      });
      if (!transfer) {
        throw new HttpException(
          "Transfer request not found",
          HttpStatus.BAD_REQUEST,
        );
      }
      if (transfer.status !== "PENDING") {
        throw new HttpException(
          "Transfer request is not pending",
          HttpStatus.BAD_REQUEST,
        );
      }
      const updatedGuild = await this.prisma.guild.update({
        where: {
          guild_id: transfer.guild_id,
        },
        data: {
          owner_user_id: newOwnerId,
        },
      });
      await this.prisma.guildOwnershipTransfers.update({
        where: {
          transfer_id: transferId,
        },
        data: {
          status: "ACCEPTED",
        },
      });
      return updatedGuild;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to accept ownership transfer",
        error.status || error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  async rejectOwnershipTransfer(guildId: number, newOwnerId: number) {
    try {
      const transfer = await this.prisma.guildOwnershipTransfers.findFirst({
        where: {
          guild_id: guildId,
          new_owner_id: newOwnerId,
          status: "PENDING",
        },
      });
      if (!transfer) {
        throw new HttpException(
          "Transfer request not found",
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.prisma.guildOwnershipTransfers.update({
        where: {
          transfer_id: transfer.transfer_id,
        },
        data: {
          status: "REJECTED",
        },
      });
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to reject ownership transfer",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPendingOwnershipTransfers(userId: number) {
    try {
      // get pending transfer for new oner and old owner
      const pendingTransfers =
        await this.prisma.guildOwnershipTransfers.findMany({
          where: {
            OR: [
              {
                old_owner_id: userId,
              },
              {
                new_owner_id: userId,
              },
            ],
            status: "PENDING",
          },
        });
      return pendingTransfers;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to fetch pending ownership transfers",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async cancelOwnershipTransfer(guildId: number, userId: number) {
    try {
      const transfer = await this.prisma.guildOwnershipTransfers.findFirst({
        where: {
          guild_id: guildId,
          OR: [
            {
              old_owner_id: userId,
            },
            {
              new_owner_id: userId,
            },
          ],
          status: "PENDING",
        },
      });
      if (!transfer) {
        throw new HttpException(
          "Transfer request not found",
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.prisma.guildOwnershipTransfers.delete({
        where: {
          transfer_id: transfer.transfer_id,
        },
      });
      return true;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to cancel ownership transfer",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getActiveRounds() {
    return this.prisma.tradingRounds.findMany({
      where: {
        start_time: { lte: new Date() },
        end_time: { gte: new Date() },
        is_active: true,
      },
      include: {
        userActivities: true,
      },
    });
  }

  async updateGuildRanks() {
    try {
      const guilds = await this.prisma.guild.findMany({
        include: {
          guildMembers: {
            select: {
              user_id: true,
            },
          },
        },
      });
      const guildPnLArray = [];

      for (const guild of guilds) {
        const guildMemberIds = guild.guildMembers.map(
          (member) => member.user_id,
        );
        const overAll = await this.prisma.userGeneralTradingActivity.findMany({
          where: {
            user_id: { in: guildMemberIds },
          },
          select: {
            pnl: true,
          },
        });

        // Calculate totalOverAllPnL using BigNumber
        let totalOverAllPnL = new BigNumber(0);
        overAll.forEach((trade) => {
          totalOverAllPnL = totalOverAllPnL.plus(trade.pnl);
        });
        // Push the guild ID and its calculated totalOverAllPnL to the array
        guildPnLArray.push({
          id: guild.guild_id,
          totalOverAllPnL: totalOverAllPnL,
        });
      }
      guildPnLArray.sort((a, b) =>
        b.totalOverAllPnL.minus(a.totalOverAllPnL).toNumber(),
      );
      for (let i = 0; i < guildPnLArray.length; i++) {
        await this.prisma.guild.update({
          where: { guild_id: guildPnLArray[i].id },
          data: { rank: i + 1 },
        });
      }

      return true;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.message || "Failed to update guild ranks",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
