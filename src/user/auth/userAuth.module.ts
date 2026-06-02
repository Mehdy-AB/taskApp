import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UserAuthController } from './userAuth.controller';
import { PrismaService } from 'src/prisma.service';
import { UserAuthService } from './userAuth.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [UserAuthController],
  providers: [UserAuthService, JwtService, PrismaService],
})
export class UserAuthModule {}