import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma-client';

@Injectable()
export class UserService {
  @Inject(PrismaService)
  private prisma: PrismaService;

  // 注册用户
  async create(data: Prisma.UserCreateInput) {
    const user = await this.prisma.user.create({
      data,
      select: {
        id: true,
      },
    });

    return user;
  }
}
