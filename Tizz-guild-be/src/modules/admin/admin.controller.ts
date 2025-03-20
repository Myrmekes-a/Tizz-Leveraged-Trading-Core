import {
  Controller,
  Post,
  Req,
  Res,
  Body,
  HttpStatus,
  Get,
  Param,

  // Query,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import {
  //   ApiBearerAuth,
  ApiTags /*ApiExcludeEndpoint,
   ApiResponse, */,
  //   ApiParam,
  ApiOperation,
  ApiBearerAuth,
} from "@nestjs/swagger";
import * as jwt from "jsonwebtoken";
import { FastifyReply, FastifyRequest } from "fastify";
import { Web3ConnectService } from "../web3Connect/web3Connect.service";
import { ApiCommonResponses } from "../../utils/decorators";
import {
  AuthDto,
  userActionDto,
  createTrendingRoundDto,
  endTrendingRoundDto,
  modifyTradingRoundDto,
} from "./admin.dto";
import { timeStamp } from "console";

@ApiTags("Admin")
@Controller("admin")
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly web3ConnectService: Web3ConnectService,
  ) {}

  @Post("auth")
  @ApiOperation({
    summary:
      "Authenticate And/Or Registers an admin using a wallet address and signature",
  })
  @ApiCommonResponses()
  async auth(
    @Req() req: FastifyRequest,
    @Body() authDto: AuthDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const { wallet_address, signature, timestamp } = authDto;
      const verified = await this.web3ConnectService.verifyWeb3Auth(
        wallet_address,
        signature,
        timestamp,
      );
      if (verified) {
        const newAdmin = await this.adminService.authenticateAdmin(
          wallet_address,
          signature,
          timestamp,
        );
        if (!newAdmin) {
          res.status(HttpStatus.UNAUTHORIZED).send({ message: "Unauthorized" });
        }
        const token = jwt.sign(
          { adminId: newAdmin.id },
          process.env.ADMIN_JWT_SECRET_KEY,
          { expiresIn: "1d" },
        );
        res.send({ token });
      } else {
        res.status(HttpStatus.UNAUTHORIZED).send({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }

  @Post("remove")
  @ApiOperation({
    summary: "Remove a user from the database",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async remove(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() userAction: userActionDto,
  ) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const { userId } = userAction;
      const removedUser = await this.adminService.removeUser(userId, adminId);
      res.send(removedUser);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }

  @Post("suspend")
  @ApiOperation({
    summary: "Suspend a user from the database",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async suspend(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() userAction: userActionDto,
  ) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const { userId } = userAction;
      const suspendedUser = await this.adminService.suspendUser(
        userId,
        adminId,
      );
      res.send(suspendedUser);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }

  @Post("activateUser")
  @ApiOperation({
    summary: "Unsuspend a user from the database",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async activateUser(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() userAction: userActionDto,
  ) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const { userId } = userAction;
      const unsuspendedUser = await this.adminService.activateUser(
        userId,
        adminId,
      );
      res.send(unsuspendedUser);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }

  @Get("getPlatFormVolume")
  @ApiOperation({
    summary: "Get the volume of the platform",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async getPlatFormVolume(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const volume = await this.adminService.getPlatFormVolume();
      res.send(volume);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }

  @Get("getActiveRounds")
  @ApiOperation({
    summary: "Get the active rounds",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async getActiveRounds(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const activeRounds = await this.adminService.getActiveRounds();
      res.send(activeRounds);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }

  @Post("createTradingRound")
  @ApiOperation({
    summary: "Create a trading round",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async createTradingRound(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() tradingRound: createTrendingRoundDto,
  ) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const { start_time, end_time } = tradingRound;
      const newRound = await this.adminService.createTradingRound(
        start_time,
        end_time,
        adminId,
      );
      res.send(newRound);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }

  @Post("endTradingRound")
  @ApiOperation({
    summary: "End a trading round",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async endTradingRound(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() tradingRound: endTrendingRoundDto,
  ) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const { round_id } = tradingRound;
      const endedRound = await this.adminService.endTradingRound(
        round_id,
        adminId,
      );
      res.send(endedRound);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }

  //modifyTradingRound
  @Post("modifyTradingRound")
  @ApiOperation({
    summary: "Modify a trading round",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async modifyTradingRound(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Body() tradingRound: modifyTradingRoundDto,
  ) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const { round_id, start_time, end_time } = tradingRound;
      const newRound = await this.adminService.modifyTradingRound(
        round_id,
        start_time,
        end_time,
        adminId,
      );
      res.send(newRound);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }

  //getTradingRoundDetails
  @Get("tradingRounds/:round_id")
  @ApiOperation({
    summary: "Get trading round details",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async getTradingRoundDetails(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Param("RoundId") round_id: number,
  ) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }

      const roundDetails =
        await this.adminService.getTradingRoundDetails(round_id);
      res.send(roundDetails);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }

  @Get("listActiveRoundParticipants/:round_id")
  @ApiOperation({
    summary: "List active round participants",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async listActiveRoundParticipants(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Param("RoundId") round_id: number,
  ) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }

      const roundParticipants =
        await this.adminService.listActiveRoundParticipants(round_id);
      res.send(roundParticipants);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }
  //listAllUserspnl
  @Get("listAllUserspnl")
  @ApiOperation({
    summary: "List all users pnl",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async listAllUserspnl(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }

      const usersPnl = await this.adminService.listAllUserspnl();
      res.send(usersPnl);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }

  @Get("listSuspendedAccounts")
  @ApiOperation({
    summary: "List all suspended accounts",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async listSuspendedAccounts(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }

      const suspendedAccounts = await this.adminService.listSuspenedUsers();
      res.send(suspendedAccounts);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }
  //getAdminActionApproval
  @Get("getAdminActionApproval")
  @ApiOperation({
    summary: "Get admin action approval",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async getAdminActionApprovals(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }

      const adminActionApproval =
        await this.adminService.getAdminActionApprovals(adminId);
      res.send(adminActionApproval);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }
  //getMyActionApproval
  @Get("getMyActionApprovals")
  @ApiOperation({
    summary: "Get my action approvals",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async getMyActionApprovals(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    try {
      const adminId = req.raw["adminId"];
      if (!adminId) {
        return res.status(401).send({ message: "Unauthorized" });
      }

      const myActionApprovals =
        await this.adminService.getMyActionApprovals(adminId);
      res.send(myActionApprovals);
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({ message: "Error" });
    }
  }
}
