import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { HttpException, HttpStatus } from "@nestjs/common";
import { Web3ConnectService } from "../web3Connect/web3Connect.service";
import { Web3ToolsService } from "../web3Tools/web3Tools.service";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private web3ConnectService: Web3ConnectService,
    private web3ToolsService: Web3ToolsService,
  ) {
    console.log("AdminService instantiated");
  }

  async createAdmin(wallet_address: `0x${string}`) {
    const ensName = await this.web3ToolsService.getEnsName(wallet_address);
    const newUser = await this.prisma.user.create({
      data: {
        wallet_address: wallet_address,
        ensName: ensName,
        role: "admin",
      },
    });
    return newUser;
  }

  async findUniqueAdminByWallet(wallet_address: string) {
    return this.prisma.user.findUnique({
      where: { wallet_address, role: "admin" },
    });
  }

  async authenticateAdmin(
    wallet_address: `0x${string}`,
    signature: `0x${string}`,
    timestamp: number,
  ) {
    //  let admin;
    const admin = await this.findUniqueAdminByWallet(wallet_address);
    const verified = await this.web3ConnectService.verifyWeb3Auth(
      wallet_address,
      signature,
      timestamp,
    );
    if (verified) {
      // if (!admin) {
      //   admin = await this.createAdmin(wallet_address);
      // }
      return admin;
    } else {
      throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);
    }
  }

  async removeUser(id: number, adminId: number) {
    const actionType = "REMOVE_USER";
    let approvalRecord = await this.prisma.adminActionApproval.findFirst({
      where: { actionType, entityId: id, status: "PENDING" },
    });

    if (!approvalRecord) {
      approvalRecord = await this.prisma.adminActionApproval.create({
        data: {
          actionType,
          entityId: id,
          initiatedBy: adminId,
          status: "PENDING",
        },
      });
      return { message: "Action pending approval." };
    } else {
      if (approvalRecord.initiatedBy !== adminId) {
        await this.prisma.adminActionApproval.update({
          where: { id: approvalRecord.id },
          data: { status: "APPROVED", updatedAt: new Date() },
        });
        // check if user exists
        const user = await this.prisma.user.findUnique({
          where: { id },
          include: {
            ownedGuilds: {
              select: {
                guild_id: true,
                name: true,
                picture: true,
                created_at: true,
                updated_at: true,
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
        // check if user owns any guilds if so assign the guild to the next memeber
        if (user.ownedGuilds.length > 0) {
          for (const guild of user.ownedGuilds) {
            const nextOwner = await this.prisma.guildMembers.findFirst({
              where: { user_id: { not: user.id }, guild_id: guild.guild_id },
            });
            if (nextOwner) {
              await this.prisma.guild.update({
                where: { guild_id: guild.guild_id },
                data: { owner_user_id: nextOwner.user_id },
              });
            } else {
              await this.prisma.guild.delete({
                where: { guild_id: guild.guild_id },
              });
            }
          }
        }
        return this.prisma.user.delete({ where: { id } });
      } else {
        return { message: "You cannot approve your own action." };
      }
    }
  }

  async suspendUser(id: number, adminId: number) {
    const actionType = "SUSPEND_USER";
    let approvalRecord = await this.prisma.adminActionApproval.findFirst({
      where: { actionType, entityId: id, status: "PENDING" },
    });
    if (!approvalRecord) {
      approvalRecord = await this.prisma.adminActionApproval.create({
        data: {
          actionType,
          entityId: id,
          initiatedBy: adminId,
          status: "PENDING",
        },
      });
      return { message: "Action pending approval." };
    } else {
      if (approvalRecord.initiatedBy !== adminId) {
        await this.prisma.adminActionApproval.update({
          where: { id: approvalRecord.id },
          data: { status: "APPROVED", updatedAt: new Date() },
        });

        await this.prisma.user.update({
          where: { id: id },
          data: { is_suspended: true },
        });

        return { message: "User suspended successfully." };
      } else {
        return { message: "You cannot approve your own action." };
      }
    }
  }

  async activateUser(id: number, adminId: number) {
    const actionType = "ACTIVATE_USER";
    let approvalRecord = await this.prisma.adminActionApproval.findFirst({
      where: { actionType, entityId: id, status: "PENDING" },
    });
    if (!approvalRecord) {
      approvalRecord = await this.prisma.adminActionApproval.create({
        data: {
          actionType,
          entityId: id,
          initiatedBy: adminId,
          status: "PENDING",
        },
      });
      return { message: "Action pending approval." };
    } else {
      if (approvalRecord.initiatedBy !== adminId) {
        await this.prisma.adminActionApproval.update({
          where: { id: approvalRecord.id },
          data: { status: "APPROVED", updatedAt: new Date() },
        });

        return this.prisma.user.update({
          where: { id },
          data: { is_suspended: false },
        });
      } else {
        return { message: "You cannot approve your own action." };
      }
    }
  }

  async getPlatFormVolume() {
    const tradingActivities = await this.prisma.userTradingActivity.findMany({
      select: {
        volume: true,
      },
    });

    const totalVolume = tradingActivities.reduce((accumulator, activity) => {
      return accumulator + parseFloat(activity.volume);
    }, 0);

    return { totalVolume };
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

  async createTradingRound(start_time: Date, end_time: Date, adminId: number) {
    const actionType = "CREATE_TRADING_ROUND";

    // Check for an existing inactive round that matches the start and end times.
    const existingRound = await this.prisma.tradingRounds.findFirst({
      where: {
        start_time,
        end_time,
        is_active: false,
      },
    });

    let roundId;

    if (!existingRound) {
      // If there's no existing round, create a new one in an inactive state.
      const newRound = await this.prisma.tradingRounds.create({
        data: {
          start_time,
          end_time,
          is_active: false, // Initially inactive
        },
      });
      roundId = newRound.round_id;
    } else {
      // Use the existing round's ID if it matches the criteria.
      roundId = existingRound.round_id;
    }

    // Check for a pending approval for this round.
    const approvalRecord = await this.prisma.adminActionApproval.findFirst({
      where: {
        actionType,
        entityId: roundId,
        status: "PENDING",
      },
    });

    if (!approvalRecord) {
      // Create a new approval record if none exists for this round.
      await this.prisma.adminActionApproval.create({
        data: {
          actionType,
          entityId: roundId,
          initiatedBy: adminId,
          status: "PENDING",
        },
      });
      return { message: "Action pending approval." };
    } else if (approvalRecord.initiatedBy !== adminId) {
      await this.prisma.adminActionApproval.update({
        where: { id: approvalRecord.id },
        data: { status: "APPROVED", updatedAt: new Date() },
      });

      await this.prisma.tradingRounds.update({
        where: { round_id: roundId },
        data: { is_active: true },
      });

      return { message: "Trading round created and activated." };
    }

    return {
      message:
        "Action already initiated by you, waiting for another admin approval.",
    };
  }

  async endTradingRound(round_id: number, adminId: number) {
    const actionType = "END_TRADING_ROUND";
    const approvalRecord = await this.prisma.adminActionApproval.findFirst({
      where: {
        actionType,
        entityId: round_id,
        status: "PENDING",
      },
    });

    if (!approvalRecord) {
      await this.prisma.adminActionApproval.create({
        data: {
          actionType,
          entityId: round_id,
          initiatedBy: adminId,
          status: "PENDING",
        },
      });
      return { message: "Action pending approval." };
    } else {
      if (approvalRecord.initiatedBy !== adminId) {
        await this.prisma.adminActionApproval.update({
          where: { id: approvalRecord.id },
          data: { status: "APPROVED", updatedAt: new Date() },
        });
        await this.prisma.tradingRounds.update({
          where: { round_id },
          data: { is_active: false },
        });
        return { message: "Trading round ended successfully." };
      } else {
        return { message: "You cannot approve your own action." };
      }
    }
  }

  async modifyTradingRound(
    round_id: number,
    start_time: Date,
    end_time: Date,
    adminId: number,
  ) {
    const actionType = "MODIFY_TRADING_ROUND";
    const approvalRecord = await this.prisma.adminActionApproval.findFirst({
      where: { actionType, entityId: round_id, status: "PENDING" },
    });
    if (!approvalRecord) {
      await this.prisma.adminActionApproval.create({
        data: {
          actionType,
          entityId: round_id,
          initiatedBy: adminId,
          status: "PENDING",
        },
      });
      return { message: "Action pending approval." };
    } else {
      if (approvalRecord.initiatedBy !== adminId) {
        await this.prisma.adminActionApproval.update({
          where: { id: approvalRecord.id },
          data: { status: "APPROVED", updatedAt: new Date() },
        });
        await this.prisma.tradingRounds.update({
          where: { round_id },
          data: { start_time, end_time },
        });
        return { message: "Trading round modified successfully." };
      } else {
        return { message: "You cannot approve your own action." };
      }
    }
  }

  async getTradingRoundDetails(round_id: number) {
    return this.prisma.tradingRounds.findUnique({
      where: { round_id, is_active: true },
      include: {
        userActivities: true,
      },
    });
  }

  async listActiveRoundParticipants(round_id: number) {
    const round = await this.prisma.tradingRounds.findUnique({
      where: { round_id, is_active: true },
      include: {
        userActivities: {
          select: {
            user_id: true,
            volume: true,
            pnl: true,
          },
        },
      },
    });

    return round;
  }

  async listAllUserspnl() {
    return this.prisma.userTradingActivity.findMany({
      select: {
        user_id: true,
        pnl: true,
      },
    });
  }

  async listSuspenedUsers() {
    return this.prisma.user.findMany({ where: { is_suspended: true } });
  }

  async getAdminActionApprovals(adminId: number) {
    //get approvalRecords with status pending and not initiated by the adminId
    const approvalRecords = await this.prisma.adminActionApproval.findMany({
      where: { initiatedBy: { not: adminId }, status: "PENDING" },
    });
    return approvalRecords;
  }

  async getMyActionApprovals(adminId: number) {
    //get approvalRecords with status pending and initiated by the adminId
    const approvalRecords = await this.prisma.adminActionApproval.findMany({
      where: { initiatedBy: adminId, status: "PENDING" },
    });
    return approvalRecords;
  }
}
