import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
} from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

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
  controllers: [EventsController],
  providers: [
    EventsService,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: RequestBodyInterceptor,
    },
  ],
  exports: [EventsService],
})
export class EventsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(isAdminAuthenticatedMiddleware)
      .forRoutes({ path: '/events/create', method: RequestMethod.POST });
    consumer
      .apply(isAdminAuthenticatedMiddleware)
      .forRoutes({ path: '/events/update', method: RequestMethod.POST });

    consumer.apply(isAdminAuthenticatedMiddleware).forRoutes({
      path: '/events/completeUserTask',
      method: RequestMethod.POST,
    });
    consumer.apply(isAdminAuthenticatedMiddleware).forRoutes({
      path: '/events/completeGuildTask',
      method: RequestMethod.POST,
    });
  }
}
