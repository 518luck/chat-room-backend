import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RedisModule } from '@/redis/redis.module';
import { EmailModule } from '@/email/email.module';

@Module({
  imports: [RedisModule, EmailModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
