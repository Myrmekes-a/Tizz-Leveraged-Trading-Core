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
import { UserService } from "./user.service";
import {
  ApiBearerAuth,
  ApiTags /*ApiExcludeEndpoint,
   */,
  ApiParam,
  // ApiQuery,
  ApiResponse,
  ApiOperation,
} from "@nestjs/swagger";
import * as jwt from "jsonwebtoken";
import { FastifyReply, FastifyRequest } from "fastify";
import { Web3ConnectService } from "../web3Connect/web3Connect.service";
import { AuthDto, UpdateUserDto } from "./user.dto";
import { ApiCommonResponses } from "../../utils/decorators";

@ApiTags("User")
@Controller("user")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly web3ConnectService: Web3ConnectService,
  ) {}

  @Post("auth")
  @ApiOperation({
    summary:
      "Authenticate And/Or Registers a user using a wallet address and signature",
  })
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
        const newUser = await this.userService.authenticateUser(
          wallet_address,
          signature,
          timestamp,
        );
        const token = jwt.sign(
          { userId: newUser.id },
          process.env.JWT_SECRET_KEY,
          { expiresIn: "4h" },
        );
        const refreshToken = jwt.sign(
          { userId: newUser.id },
          process.env.JWT_REFRESH_SECRET_KEY,
          { expiresIn: "24h" },
        );
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await this.userService.storeRefreshToken(
          newUser.id,
          refreshToken,
          expiresAt,
        );

        const expirationTime = new Date().getTime() + 4 * 60 * 60 * 1000;
        const refreshTokenExpirationTime =
          new Date().getTime() + 24 * 60 * 60 * 1000;

        res.send({
          token,
          refreshToken,
          expirationTime,
          refreshTokenExpirationTime,
        });
      } else {
        res.status(HttpStatus.UNAUTHORIZED).send({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: "Internal Server Error" });
    }
  }

  @Post("refreshToken")
  @ApiOperation({ summary: "Refresh User Token" })
  @ApiBearerAuth()
  async refreshToken(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      const refreshToken = req.headers.authorization?.replace("Bearer ", "");
      if (!refreshToken) {
        return res.status(401).send({ message: "Unauthorized" });
      }

      jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET_KEY,
        async (error, decoded) => {
          if (error) {
            console.log(error);
            return res.status(401).send({ message: "Unauthorized" });
          } else {
            const jwtPayload = decoded as jwt.JwtPayload;
            const userId = jwtPayload.userId;

            // Check if the refresh token is valid
            const isValid = await this.userService.validateRefreshToken(
              userId,
              refreshToken,
            );
            if (!isValid) {
              return res.status(401).send({ message: "Token No longer Valid" });
            }

            // Invalidate the used refresh token
            await this.userService.invalidateRefreshToken(userId, refreshToken);

            const newToken = jwt.sign(
              { userId: jwtPayload.userId },
              process.env.JWT_SECRET_KEY,
              {
                expiresIn: "4h",
              },
            );
            const newRefreshToken = jwt.sign(
              { userId: jwtPayload.userId },
              process.env.JWT_REFRESH_SECRET_KEY,
              { expiresIn: "24h" },
            );

            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            // Store the new refresh token
            await this.userService.storeRefreshToken(
              userId,
              newRefreshToken,
              expiresAt,
            );

            const expirationTime = new Date().getTime() + 4 * 60 * 60 * 1000;
            const expirationTimeRefreshToken =
              new Date().getTime() + 24 * 60 * 60 * 1000;

            const jwtToken = {
              token: newToken,
              refreshToken: newRefreshToken,
              expirationTime,
              expirationTimeRefreshToken,
            };

            return res.status(200).send({ jwtToken });
          }
        },
      );
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  }

  @Post("updateUser")
  @ApiOperation({ summary: "Update User Data and profile picture" })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async updateUser(
    @Req() req: FastifyRequest,
    @Body() updateUserDto: UpdateUserDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const user = await this.userService.updateUser(userId, updateUserDto);
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }
      res.status(200).send(user);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  }

  @Get("/users")
  @ApiOperation({ summary: "Retrieve All Users with Pagination" })
  @ApiResponse({ status: 404, description: "No users found." })
  @ApiResponse({ status: 500, description: "Internal server error." })
  @ApiCommonResponses()
  async users(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      // const cursorInt = parseInt(cursor.toString());
      const users = await this.userService.getAllUsers();
      if (!users) {
        return res.status(404).send({ message: "No users found" });
      }
      return res.status(200).send(users);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  }
  // @Get('/users')
  // @ApiOperation({ summary: 'Retrieve All Users with Pagination' })
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
  // @ApiResponse({ status: 404, description: 'No users found.' })
  // @ApiResponse({ status: 500, description: 'Internal server error.' })
  // @ApiCommonResponses()
  // async users(
  //   @Req() req: FastifyRequest,
  //   @Res() res: FastifyReply,
  //   @Query('cursor') cursor: number | null = null,
  //   @Query('pageSize') pageSize: number = 10,
  // ) {
  //   try {
  //     // const cursorInt = parseInt(cursor.toString());
  //     const pageSizeInt = parseInt(pageSize.toString());
  //     const users = await this.userService.getUsers(cursor, pageSizeInt);
  //     if (!users) {
  //       return res.status(404).send({ message: 'No users found' });
  //     }
  //     return res.status(200).send(users);
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send({ message: 'Internal server error' });
  //   }
  // }
  @Get("/getUser")
  @ApiOperation({
    summary:
      "Retrieve User data, ownedGuilds, and list of guilds a user is a member of",
  })
  @ApiCommonResponses()
  @ApiBearerAuth()
  async getUser(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    try {
      const userId = req.raw["userId"];
      if (!userId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const user = await this.userService.getUser(userId);
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }
      res.status(200).send(user);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  }

  @Get(":userId")
  @ApiOperation({
    summary:
      "Retrieve User data, ownedGuilds, and list of guilds a user is a member of",
  })
  @ApiCommonResponses()
  @ApiParam({
    name: "userId",
    required: true,
    description: "The unique identifier of the user.",
    type: "number",
  })
  async getUserbyID(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Param("userId") userId: number,
  ) {
    try {
      if (!userId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const id = parseFloat(userId.toString());
      const user = await this.userService.getUser(id);
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }
      res.status(200).send(user);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  }

  @Get("wallet/:walletAddress")
  @ApiOperation({
    summary:
      "Retrieve User data, ownedGuilds, and list of guilds a user is a member of",
  })
  @ApiCommonResponses()
  @ApiParam({
    name: "walletAddress",
    required: true,
    description: "The unique identifier of the user.",
    type: "string",
  })
  async getUserbyWalletAddress(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Param("walletAddress") walletAddress: string,
  ) {
    try {
      if (!walletAddress) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const user = await this.userService.getUserByWallet(walletAddress);
      if (!user) {
        return res.status(404).send({ message: "User not found" });
      }
      res.status(200).send(user);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  }

  @Get(":userId/pnl")
  @ApiOperation({ summary: "Retrieve User Profit and Loss Data" })
  @ApiCommonResponses()
  @ApiParam({
    name: "userId",
    required: true,
    description: "The unique identifier of the user.",
    type: "number",
  })
  async getUserPnL(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Param("userId") userId: number,
  ) {
    try {
      if (!userId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const user_id = parseFloat(userId.toString());
      const pnl = await this.userService.getUserPnL(user_id);
      if (!pnl) {
        return res.status(404).send({ message: "No pnl found" });
      }
      return res.status(200).send(pnl);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  }
  @Get(":userId/volume")
  @ApiOperation({ summary: "Retrieve User Volume Data" })
  @ApiCommonResponses()
  @ApiParam({
    name: "userId",
    required: true,
    description: "The unique identifier of the user.",
    type: "number",
  })
  async getUserVolume(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Param("userId") userId: number,
  ) {
    try {
      if (!userId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const user_id = parseFloat(userId.toString());

      const volume = await this.userService.getUserVolume(user_id);
      if (!volume) {
        return res.status(404).send({ message: "No volume found" });
      }
      return res.status(200).send(volume);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  }
  //get user wins
  @Get(":userId/wins")
  @ApiOperation({ summary: "Retrieve User Wins Data" })
  @ApiCommonResponses()
  @ApiParam({
    name: "userId",
    required: true,
    description: "The unique identifier of the user.",
    type: "number",
  })
  async getUserWins(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
    @Param("userId") userId: number,
  ) {
    try {
      if (!userId) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const user_id = parseFloat(userId.toString());
      const wins = await this.userService.getUserWins(user_id);
      if (!wins) {
        return res.status(404).send({ message: "No wins found" });
      }
      return res.status(200).send(wins);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Internal server error" });
    }
  }
}
