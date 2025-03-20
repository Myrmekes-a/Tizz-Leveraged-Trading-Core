import {
  Controller,
  Post,
  Req,
  Res,
  Body,
  HttpStatus,
  Get,
  // Get,
  Param,
  HttpException,
  // Query,
} from "@nestjs/common";
import { GuildService } from "./guild.service";
import {
  ApiBearerAuth,
  ApiTags /*ApiExcludeEndpoint,*/,
  // ApiParam,
  ApiOperation,
  // ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { FastifyReply, FastifyRequest } from "fastify";
import { Web3ConnectService } from "../web3Connect/web3Connect.service";
import {
  CreateGuildDto,
  UpdateGuildDto,
  joinGuilDto,
  invitationRequestDto,
  joinRequestGuilDto,
  invitationRequesbyAddressDto,
} from "./guild.dto";

import { ApiCommonResponses } from "../../utils/decorators";

@ApiTags("Guild")
@Controller("guild")
export class GuildController {
  constructor(
    private readonly guildService: GuildService,
    private readonly web3ConnectService: Web3ConnectService,
  ) {}

  @Post("create")
  @ApiOperation({
    summary: "Create a new guild",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async create(
    @Req() req: FastifyRequest,
    @Body() guildData: CreateGuildDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const owner_user_id = req.raw["userId"];
      if (!owner_user_id) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }

      const newGuild = await this.guildService.createGuild(
        guildData,
        owner_user_id,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      if (error instanceof HttpException) {
        return res.status(error.getStatus()).send(error);
      }
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Post("delete")
  @ApiOperation({
    summary: "Delete a guild",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async delete(
    @Req() req: FastifyRequest,
    @Body() body: joinGuilDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const owner_user_id = req.raw["userId"];
      if (!owner_user_id) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const { guild_id } = body;
      const newGuild = await this.guildService.removeGuild(
        guild_id,
        owner_user_id,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Get("guilds")
  @ApiOperation({
    summary: "Get all guilds",
  })
  @ApiCommonResponses()
  @ApiResponse({
    status: 200,
    description: "Successful retrieval of user list.",
  })
  @ApiResponse({ status: 404, description: "No Guilds found." })
  @ApiResponse({ status: 500, description: "Internal server error." })
  async getGuilds(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      const guilds = await this.guildService.getAllGuilds();
      if (!guilds) {
        return res.status(HttpStatus.BAD_REQUEST).send("Guild not found");
      }
      return res.status(HttpStatus.OK).send(guilds);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }
  // @Get('guilds')
  // @ApiOperation({
  //   summary: 'Get all guilds',
  // })
  // @ApiCommonResponses()
  // @ApiQuery({
  //   name: 'cursor',
  //   required: false,
  //   type: Number,
  //   description: 'Cursor to fetch the next set of users',
  // })
  // @ApiQuery({
  //   name: 'pageSize',
  //   required: false,
  //   type: Number,
  //   description: 'Number of items per page',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Successful retrieval of user list.',
  // })
  // @ApiResponse({ status: 404, description: 'No Guilds found.' })
  // @ApiResponse({ status: 500, description: 'Internal server error.' })
  // async getGuilds(
  //   @Req() req: FastifyRequest,
  //   @Res() res: FastifyReply,
  //   @Query('page') cursor: number | null = null,
  //   @Query('pageSize') pageSize: number = 10,
  // ) {
  //   try {
  //     const pageSizeInt = parseInt(pageSize.toString());
  //     const guilds = await this.guildService.getGuilds(cursor, pageSizeInt);
  //     if (!guilds) {
  //       return res.status(HttpStatus.BAD_REQUEST).send('Guild not found');
  //     }
  //     return res.status(HttpStatus.OK).send(guilds);
  //   } catch (error) {
  //     return res.status(HttpStatus.BAD_REQUEST).send(error);
  //   }
  // }

  @Get(":guildId")
  @ApiOperation({
    summary:
      "Get a guild details, members, pnl Aggregation and Trading Volume by id",
  })
  @ApiCommonResponses()
  async getGuild(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Param("guildId") guildId: number,
  ) {
    try {
      if (!guildId)
        return res.status(HttpStatus.BAD_REQUEST).send("Guild not found");
      const guild_id = parseFloat(guildId.toString());
      const guild = await this.guildService.getGuild(guild_id);
      return res.status(HttpStatus.OK).send(guild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Post("update")
  @ApiOperation({
    summary: "Update a guild",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async update(
    @Req() req: FastifyRequest,
    @Body() updateData: UpdateGuildDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const owner_user_id = req.raw["userId"];
      if (!owner_user_id) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      // remove guild_id from the update data;
      const { guild_id, ...guildData } = updateData;

      const newGuild = await this.guildService.updateGuild(
        guild_id,
        guildData,

        owner_user_id,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Post("createJoinRequest")
  @ApiOperation({
    summary: "Request to Join a guild",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async createJoinRequest(
    @Req() req: FastifyRequest,
    @Body() body: joinGuilDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const { guild_id } = body;
      const user_id = parseFloat(userId);
      const newGuild = await this.guildService.createJoinRequest(
        guild_id,
        user_id,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Post("acceptJoinRequest")
  @ApiOperation({
    summary: "Accept  a users join request for the guild by the owner",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async acceptJoinRequest(
    @Req() req: FastifyRequest,
    @Body() body: joinRequestGuilDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const ownerId = parseFloat(userId);
      const { action_id } = body;
      const newGuild = await this.guildService.acceptJoinRequest(
        action_id,
        ownerId,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Post("declineJoinRequest")
  @ApiOperation({
    summary: "Reject a users join request for the guild by the owner",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async declineJoinRequest(
    @Req() req: FastifyRequest,
    @Body() body: joinRequestGuilDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const ownerId = parseFloat(userId);
      const { action_id } = body;
      const newGuild = await this.guildService.rejectJoinRequest(
        action_id,
        ownerId,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Post("sendInvitationRequest")
  @ApiOperation({
    summary: "Send an invitation to join a guild",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async sendInvitationRequest(
    @Req() req: FastifyRequest,
    @Body() body: invitationRequestDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const ownerId = parseFloat(userId);
      const { guild_id, user_id } = body;
      const newGuild = await this.guildService.sendInvitationRequest(
        guild_id,
        user_id,
        ownerId,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Post("sendInvitationRequestByAddress")
  @ApiOperation({
    summary: "Send an invitation to join a guild",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async sendInvitationRequestByAddress(
    @Req() req: FastifyRequest,
    @Body() body: invitationRequesbyAddressDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const ownerId = parseFloat(userId);
      const { guild_id, address } = body;
      const newGuild = await this.guildService.sendInvitationRequestByAddress(
        guild_id,
        address,
        ownerId,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Post("acceptInvitationRequest")
  @ApiOperation({
    summary: "Accept an invitation to join a guild",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async acceptInvitationRequest(
    @Req() req: FastifyRequest,
    @Body() body: joinRequestGuilDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const user_id = parseFloat(userId);
      const { action_id } = body;
      const newGuild = await this.guildService.acceptInvitationRequest(
        action_id,
        user_id,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Post("declineInvitationRequest")
  @ApiOperation({
    summary: "Decline an invitation to join a guild",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async declineInvitationRequest(
    @Req() req: FastifyRequest,
    @Body() body: joinRequestGuilDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const user_id = parseFloat(userId);
      const { action_id } = body;
      const newGuild = await this.guildService.rejectInvitationRequest(
        action_id,
        user_id,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Get("getInvitationRequests/:user_id")
  @ApiOperation({
    summary: "Get all invitation requests for a user",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async getUserInvitationRequests(
    @Req() req: FastifyRequest,
    @Param("user_id") userId: number,
    @Res() res: FastifyReply,
  ) {
    try {
      const user_id = parseFloat(userId.toString());
      const jwtUserId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      if (jwtUserId !== user_id) {
        return res.status(HttpStatus.BAD_REQUEST).send("Unauthorized");
      }

      const requests =
        await this.guildService.getUserInvitationRequests(jwtUserId);
      return res.status(HttpStatus.OK).send(requests);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }
  @Get("getJoinRequests/:guild_id")
  @ApiOperation({
    summary: "Get all join requests for a guild",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async getGuildJoinRequests(
    @Req() req: FastifyRequest,
    @Param("guild_id") guild_id: number,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const ownerId = parseFloat(userId);
      const guildId = parseFloat(guild_id.toString());
      const requests = await this.guildService.getGuildJoinRequests(
        guildId,
        ownerId,
      );
      return res.status(HttpStatus.OK).send(requests);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Post("leave")
  @ApiOperation({
    summary: "Leave a guild",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async leave(
    @Req() req: FastifyRequest,
    @Body() body: joinGuilDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const { guild_id } = body;
      const user_id = parseFloat(userId);
      const newGuild = await this.guildService.leaveGuild(guild_id, user_id);
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }
  @Post("kick")
  @ApiOperation({
    summary: "Kick a user from a guild",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async kick(
    @Req() req: FastifyRequest,
    @Body() body: invitationRequestDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const ownerId = parseFloat(userId);
      const { guild_id, user_id } = body;
      const newGuild = await this.guildService.removeMember(
        guild_id,
        user_id,
        ownerId,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  @Post("createOwnershipTransfer")
  @ApiOperation({
    summary: "Create An ownership Transfer demand for a guild",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async createOwnershipTransfer(
    @Req() req: FastifyRequest,
    @Body() body: invitationRequestDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const ownerId = parseFloat(userId);
      const { guild_id, user_id } = body;
      const newGuild = await this.guildService.createOwnershipTransfer(
        guild_id,
        user_id,
        ownerId,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }
  @Post("acceptOwnershipTransfer")
  @ApiOperation({
    summary: "Accept an ownership transfer request",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async acceptOwnershipTransfer(
    @Req() req: FastifyRequest,
    @Body() body: joinGuilDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const user_id = parseFloat(userId);
      const { guild_id } = body;
      const newGuild = await this.guildService.acceptOwnershipTransfer(
        guild_id,
        user_id,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }
  @Post("declineOwnershipTransfer")
  @ApiOperation({
    summary: "Reject an ownership transfer request",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async declineOwnershipTransfer(
    @Req() req: FastifyRequest,
    @Body() body: joinGuilDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const user_id = parseFloat(userId);
      const { guild_id } = body;
      const newGuild = await this.guildService.rejectOwnershipTransfer(
        guild_id,
        user_id,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  //cancelOwnershipTransfer
  @Post("cancelOwnershipTransfer")
  @ApiOperation({
    summary: "Cancel an ownership transfer request",
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async cancelOwnershipTransfer(
    @Req() req: FastifyRequest,
    @Body() body: joinGuilDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("Unauthorized");
      }
      const user_id = parseFloat(userId);
      const { guild_id } = body;
      const newGuild = await this.guildService.cancelOwnershipTransfer(
        guild_id,
        user_id,
      );
      return res.status(HttpStatus.OK).send(newGuild);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  //getPendingOwnershipTransfers
  @Get("getPendingOwnershipTransfers")
  @ApiOperation({
    summary: "Get all pending ownership transfers for a user",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async getPendingOwnershipTransfers(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).send("User not found");
      }
      const user_id = parseFloat(userId);
      const transfers =
        await this.guildService.getPendingOwnershipTransfers(user_id);
      return res.status(HttpStatus.OK).send(transfers);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }

  //getActiveRounds
  @Get("getActiveRounds")
  @ApiOperation({
    summary: "Get all active rounds for a guild",
  })
  @ApiCommonResponses()
  async getActiveRounds(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      const rounds = await this.guildService.getActiveRounds();
      return res.status(HttpStatus.OK).send(rounds);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).send(error);
    }
  }
}
