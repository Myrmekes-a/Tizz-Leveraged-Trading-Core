import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
} from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

import {
  IsAuthenticatedMiddleware,
  isRefreshAuthenticatedMiddleware,
} from "../../middleware/isAuthenticated.middleware";
import { Web3ConnectModule } from "../web3Connect/web3Connect.module";
import { Web3ToolsModule } from "../web3Tools/web3Tools.module";
import { PrismaModule } from "../prisma/prisma.module";
import { RequestBodyInterceptor } from "../../interceptors/RequestBodyInterceptor";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [PrismaModule, HttpModule, Web3ConnectModule, Web3ToolsModule],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: "APP_INTERCEPTOR",
      useClass: RequestBodyInterceptor,
    },
  ],
  exports: [UserService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IsAuthenticatedMiddleware)
      .forRoutes({ path: "/user/updateUser", method: RequestMethod.POST });
    //refreshToken
    consumer
      .apply(isRefreshAuthenticatedMiddleware)
      .forRoutes({ path: "/user/refreshToken", method: RequestMethod.POST });
    consumer
      .apply(IsAuthenticatedMiddleware)
      .forRoutes({ path: "/user/getUser", method: RequestMethod.GET });
  }
}
