import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { UserModule } from './user/user.module';
import { UserAuthModule } from './user/auth/userAuth.module';
import { GhostModule } from './gost/ghost.module';
import { ChatModule } from './user/chat/chat.module';

@Module({
 
  controllers: [AppController],
  providers: [AppService, PrismaService],
  imports: [ ConfigModule.forRoot(),UserModule, UserAuthModule,GhostModule,ChatModule],
})
export class AppModule {}
