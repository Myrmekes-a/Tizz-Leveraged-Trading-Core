import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
} from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

import {
  IsAuthenticatedMiddleware,
  isAdminAuthenticatedMiddleware,
} from '../../middleware/isAuthenticated.middleware';
import { Web3ConnectModule } from '../web3Connect/web3Connect.module';
import { Web3ToolsModule } from '../web3Tools/web3Tools.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RequestBodyInterceptor } from '../../interceptors/RequestBodyInterceptor';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, HttpModule, Web3ConnectModule, Web3ToolsModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: RequestBodyInterceptor,
    },
  ],
  exports: [AdminService],
})
export class AdminModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(isAdminAuthenticatedMiddleware)
      .forRoutes({ path: '/admin/remove', method: RequestMethod.GET });
    consumer
      .apply(isAdminAuthenticatedMiddleware)
      .forRoutes({ path: '/admin/suspend', method: RequestMethod.POST });
    consumer
      .apply(isAdminAuthenticatedMiddleware)
      .forRoutes({ path: '/admin/activateUser', method: RequestMethod.POST });
    consumer.apply(isAdminAuthenticatedMiddleware).forRoutes({
      path: '/admin/createTradingRound',
      method: RequestMethod.POST,
    });
    consumer.apply(isAdminAuthenticatedMiddleware).forRoutes({
      path: '/admin/endTradingRound',
      method: RequestMethod.POST,
    });
    consumer.apply(isAdminAuthenticatedMiddleware).forRoutes({
      path: '/admin/modifyTradingRound',
      method: RequestMethod.POST,
    });

    consumer.apply(isAdminAuthenticatedMiddleware).forRoutes({
      path: '/admin/getPlatFormVolume',
      method: RequestMethod.GET,
    });
    consumer.apply(isAdminAuthenticatedMiddleware).forRoutes({
      path: '/admin/getActiveRounds',
      method: RequestMethod.GET,
    });
    consumer.apply(isAdminAuthenticatedMiddleware).forRoutes({
      path: '/admin/tradingRounds/:round_id',
      method: RequestMethod.GET,
    });
    consumer.apply(IsAuthenticatedMiddleware).forRoutes({
      path: '/admin/listActiveRoundParticipants/:round_id',
      method: RequestMethod.GET,
    });
    consumer.apply(isAdminAuthenticatedMiddleware).forRoutes({
      path: '/admin/listAllUserspnl',
      method: RequestMethod.GET,
    });
    consumer.apply(isAdminAuthenticatedMiddleware).forRoutes({
      path: '/admin/listSuspendedAccounts',
      method: RequestMethod.GET,
    });
  }
}
