import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { userController } from './user.controller';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../lib/cloudinary.provider';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [userController],
  providers: [ UserService,PrismaService,JwtService,CloudinaryService],
})
export class UserModule {}
