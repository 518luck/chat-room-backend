import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { UserModule } from '@/user/user.module';
import { RedisModule } from '@/redis/redis.module';
import { EmailModule } from '@/email/email.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '@/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { FriendshipModule } from './friendship/friendship.module';
import { ChatroomModule } from './chatroom/chatroom.module';
import { MinioModule } from './minio/minio.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    RedisModule,
    EmailModule,
    JwtModule.registerAsync({
      global: true,
      useFactory() {
        return {
          secret: 'guang',
          signOptions: {
            expiresIn: '30m', // 默认 30 分钟
          },
        };
      },
    }),
    FriendshipModule,
    ChatroomModule,
    MinioModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
