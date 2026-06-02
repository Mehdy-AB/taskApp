import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { GhostController } from './ghost.controller';
import { GhostService } from './ghost.service';


@Module({
  controllers: [GhostController],
  providers: [GhostService,PrismaService,JwtService],
})
export class GhostModule {}