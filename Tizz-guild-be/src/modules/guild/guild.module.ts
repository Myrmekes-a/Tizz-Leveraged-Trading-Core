import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
} from "@nestjs/common";
import { GuildController } from "./guild.controller";
import { GuildService } from "./guild.service";

import { IsAuthenticatedMiddleware } from "../../middleware/isAuthenticated.middleware";
import { Web3ConnectModule } from "../web3Connect/web3Connect.module";
import { Web3ToolsModule } from "../web3Tools/web3Tools.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RequestBodyInterceptor } from "../../interceptors/RequestBodyInterceptor";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [PrismaModule, HttpModule, Web3ConnectModule, Web3ToolsModule],
  controllers: [GuildController],
  providers: [
    GuildService,
    {
      provide: "APP_INTERCEPTOR",
      useClass: RequestBodyInterceptor,
    },
  ],
  exports: [GuildService],
})
export class GuildModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IsAuthenticatedMiddleware)
      .forRoutes({ path: "/guild/create", method: RequestMethod.POST });
    consumer
      .apply(IsAuthenticatedMiddleware)
      .forRoutes({ path: "/guild/update", method: RequestMethod.POST });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/createJoinRequest",
      method: RequestMethod.POST,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/acceptJoinRequest",
      method: RequestMethod.POST,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/declineJoinRequest",
      method: RequestMethod.POST,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/cancelOwnershipTransfer",
      method: RequestMethod.POST,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/getInvitationRequests/:user_id",
      method: RequestMethod.GET,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/getPendingOwnershipTransfers",
      method: RequestMethod.GET,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/sendInvitationRequest",
      method: RequestMethod.POST,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/sendInvitationRequestByAddress",
      method: RequestMethod.POST,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/acceptInvitationRequest",
      method: RequestMethod.POST,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/declineInvitationRequest",
      method: RequestMethod.POST,
    });
    consumer
      .apply(IsAuthenticatedMiddleware)
      .forRoutes({ path: "/guild/leave", method: RequestMethod.POST });
    consumer
      .apply(IsAuthenticatedMiddleware)
      .forRoutes({ path: "/guild/kick", method: RequestMethod.POST });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/createOwnershipTransfer",
      method: RequestMethod.POST,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/acceptOwnershipTransfer",
      method: RequestMethod.POST,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/declineOwnershipTransfer",
      method: RequestMethod.POST,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/delete",
      method: RequestMethod.POST,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/getUserInvitationRequests/:user_id",
      method: RequestMethod.GET,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: "/guild/getJoinRequests/:guild_id",
      method: RequestMethod.GET,
    });
  }
}
