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
} from '@nestjs/common';
import { EventsService } from './events.service';
import {
  //   ApiBearerAuth,
  ApiTags /*ApiExcludeEndpoint,
    ApiResponse, */,
  //   ApiParam,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Web3ConnectService } from '../web3Connect/web3Connect.service';
import { ApiCommonResponses } from '../../utils/decorators';
import { CreateEventDto, CreateTaskDto } from './events.dto';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly web3ConnectService: Web3ConnectService,
  ) {}

  @Post('createEvent')
  @ApiOperation({
    summary: 'Create a new event',
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async createEvent(
    @Req() req: FastifyRequest,
    @Body() createEventDto: CreateEventDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const adminId = req.raw['adminId'];
      if (!adminId) {
        return res.status(401).send({ message: 'Unauthorized' });
      }
      const { name, description, eventType } = createEventDto;
      const newEvent = await this.eventsService.createEvent(
        name,
        description,
        eventType,
      );
      res.send(newEvent);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: 'Internal Server Error' });
    }
  }
  //get events
  @Get('getEvents')
  @ApiOperation({
    summary: 'Get all events',
  })
  @ApiCommonResponses()
  async getEvents(@Res() res: FastifyReply) {
    try {
      const events = await this.eventsService.getEvents();
      res.send(events);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: 'Internal Server Error' });
    }
  }

  //get event by id
  @Get('getEvent/:id')
  @ApiOperation({
    summary: 'Get event by id',
  })
  @ApiCommonResponses()
  async getEvent(@Param('id') id: number, @Res() res: FastifyReply) {
    try {
      const event = await this.eventsService.getEventById(id);
      res.send(event);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: 'Internal Server Error' });
    }
  }

  //create task
  @Post('createTask')
  @ApiOperation({
    summary: 'Create a new task',
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async createTask(
    @Req() req: FastifyRequest,
    @Body() createTaskDto: CreateTaskDto,
    @Res() res: FastifyReply,
  ) {
    try {
      const adminId = req.raw['adminId'];
      if (!adminId) {
        return res.status(401).send({ message: 'Unauthorized' });
      }
      const { eventId, name, description, points } = createTaskDto;
      const newTask = await this.eventsService.createTask(
        eventId,
        name,
        description,
        points,
      );
      res.send(newTask);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: 'Internal Server Error' });
    }
  }

  //complete user task
  @Post('completeUserTask')
  @ApiOperation({
    summary: 'Complete a task',
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async completeUserTask(
    @Req() req: FastifyRequest,
    @Body() body: { userId: number; taskId: number },
    @Res() res: FastifyReply,
  ) {
    try {
      const adminId = req.raw['adminId'];
      if (!adminId) {
        return res.status(401).send({ message: 'Unauthorized' });
      }
      const { userId, taskId } = body;
      const participation = await this.eventsService.completeUserTask(
        userId,
        taskId,
      );
      res.send(participation);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: 'Internal Server Error' });
    }
  }

  //complete guild task
  @Post('completeGuildTask')
  @ApiOperation({
    summary: 'Complete a guild task',
  })
  @ApiBearerAuth()
  @ApiCommonResponses()
  async completeGuildTask(
    @Req() req: FastifyRequest,
    @Body() body: { guildId: number; taskId: number },
    @Res() res: FastifyReply,
  ) {
    try {
      const adminId = req.raw['adminId'];
      if (!adminId) {
        return res.status(401).send({ message: 'Unauthorized' });
      }
      const { guildId, taskId } = body;
      const participation = await this.eventsService.completeGuildTask(
        guildId,
        taskId,
      );
      res.send(participation);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: 'Internal Server Error' });
    }
  }
}
