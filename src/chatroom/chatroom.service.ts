import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ChatroomService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  // 创建一对一聊天房间
  async createOneToOneChatroom(friendId: number, userId: number) {
    // 检查好友是否存在
    const friend = await this.prismaService.user.findUnique({
      where: {
        id: friendId,
      },
    });
    if (!friend) {
      throw new BadRequestException('聊天好友不存在');
    }

    // 创建聊天房间
    const { id } = await this.prismaService.chatroom.create({
      data: {
        name: '聊天室' + Math.random().toString().slice(2, 8),
        type: false,
      },
      select: {
        id: true,
      },
    });

    // 加入用户和好友到聊天房间
    await this.prismaService.userChatroom.create({
      data: {
        userId,
        chatroomId: id,
      },
    });

    // 加入好友到聊天房间
    await this.prismaService.userChatroom.create({
      data: {
        userId: friendId,
        chatroomId: id,
      },
    });
    return '创建成功';
  }

  // 创建群聊房间
  async createGroupChatroom(name: string, userId: number) {
    // 检查群聊名称是否为空
    if (!name) {
      throw new BadRequestException('群聊名称不能为空');
    }
    const { id } = await this.prismaService.chatroom.create({
      data: {
        name,
        type: true,
      },
    });

    // 加入用户到群聊房间
    await this.prismaService.userChatroom.create({
      data: {
        userId,
        chatroomId: id,
      },
    });
    return '创建成功';
  }
}
