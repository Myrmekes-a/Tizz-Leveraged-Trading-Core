import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// import { HttpException, HttpStatus } from '@nestjs/common';
import { Web3ConnectService } from '../web3Connect/web3Connect.service';
import { Web3ToolsService } from '../web3Tools/web3Tools.service';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private web3ConnectService: Web3ConnectService,
    private web3ToolsService: Web3ToolsService,
  ) {
    console.log('EventsService instantiated');
  }

  async getEvents() {
    return this.prisma.event.findMany();
  }

  async getEventById(id: number) {
    return this.prisma.event.findUnique({
      where: {
        id,
      },
    });
  }

  async createEvent(
    name: string,
    description: string,
    eventType: 'USER' | 'GUILD',
  ) {
    const newEvent = await this.prisma.event.create({
      data: {
        name,
        description,
        eventType,
      },
    });
    return newEvent;
  }

  async createTask(
    eventId: number,
    name: string,
    description: string,
    points: number,
  ) {
    const newTask = await this.prisma.task.create({
      data: {
        eventId,
        name,
        description,
        points,
      },
    });
    return newTask;
  }

  async completeUserTask(userId: number, taskId: number) {
    // Check if the task completion already exists
    const existingParticipation =
      await this.prisma.userTaskParticipation.findUnique({
        where: {
          userId_taskId: { userId, taskId },
        },
      });

    if (!existingParticipation) {
      // If not, create a new participation record
      const participation = await this.prisma.userTaskParticipation.create({
        data: {
          userId,
          taskId,
          completed: true,
          // Assuming points are awarded based on the task's defined points
          pointsAwarded: (
            await this.prisma.task.findUnique({
              where: { id: taskId },
              select: { points: true },
            })
          )?.points,
        },
      });
      return participation;
    } else if (!existingParticipation.completed) {
      // If exists but not completed, update it
      const updatedParticipation =
        await this.prisma.userTaskParticipation.update({
          where: {
            userId_taskId: { userId, taskId },
          },
          data: { completed: true },
        });
      return updatedParticipation;
    }

    // Return a message if the task was already completed
    return { message: 'Task already completed by user.' };
  }

  async completeGuildTask(guildId: number, taskId: number) {
    // Similar logic to completeUserTask, but for guilds
    const existingParticipation =
      await this.prisma.guildTaskParticipation.findUnique({
        where: {
          guildId_taskId: { guildId, taskId },
        },
      });

    if (!existingParticipation) {
      const participation = await this.prisma.guildTaskParticipation.create({
        data: {
          guildId,
          taskId,
          completed: true,
          pointsAwarded: (
            await this.prisma.task.findUnique({
              where: { id: taskId },
              select: { points: true },
            })
          )?.points,
        },
      });
      return participation;
    } else if (!existingParticipation.completed) {
      const updatedParticipation =
        await this.prisma.guildTaskParticipation.update({
          where: {
            guildId_taskId: { guildId, taskId },
          },
          data: { completed: true },
        });
      return updatedParticipation;
    }

    return { message: 'Task already completed by guild.' };
  }
}
