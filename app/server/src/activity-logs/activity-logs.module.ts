import { Module } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service.js';
import { ActivityLogsController } from './activity-logs.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports:     [PrismaModule],
  controllers: [ActivityLogsController],
  providers:   [ActivityLogsService],
})
export class ActivityLogsModule {}
