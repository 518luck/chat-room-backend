import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Chatroom } from '@prisma-client';

// Pick 是 TypeScript 内置的一个工具类型（Utility Type）。它的作用正如其名：从一个已有的对象类型中，“挑选”出你需要的几个属性，组成一个新的类型。
type SelectedChatroom = Pick<Chatroom, 'id' | 'name' | 'type' | 'createTime'>;
// 使用类型交叉 & 组合原始类型和新字段
export type ChatroomWithUsers = SelectedChatroom & {
  userCount: number;
  userIds: number[];
};

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

  // 查看所有群聊
  async list(userId: number, name?: string) {
    //findMany: Prisma 的方法，用于查询多条记录。如果没有匹配项，它会返回一个空数组 [] 而不是报错。
    const chatroomIds = await this.prismaService.userChatroom.findMany({
      where: {
        userId,
      },
      select: {
        chatroomId: true,
      },
    });
    const chatrooms = await this.prismaService.chatroom.findMany({
      where: {
        id: {
          //一次性处理一批特定的数据，而不是一个一个去求数据库。
          in: chatroomIds.map((item) => item.chatroomId),
        },
        name: {
          contains: name,
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        createTime: true,
      },
    });

    const res: ChatroomWithUsers[] = [];
    for (let i = 0; i < chatrooms.length; i++) {
      const userIds = await this.prismaService.userChatroom.findMany({
        where: {
          chatroomId: chatrooms[i].id,
        },
        select: {
          userId: true,
        },
      });
      res.push({
        ...chatrooms[i],
        userCount: userIds.length, // 加入群聊的用户数量
        userIds: userIds.map((item) => item.userId),
      });
    }

    return res;
  }

  // 查询聊天室的所有用户
  async members(chatroomId: number) {
    const userIds = await this.prismaService.userChatroom.findMany({
      where: {
        chatroomId,
      },
      select: {
        userId: true,
      },
    });
    const users = await this.prismaService.user.findMany({
      where: {
        id: {
          in: userIds.map((item) => item.userId),
        },
      },
      select: {
        id: true,
        username: true,
        nickName: true,
        headPic: true,
        createTime: true,
        email: true,
      },
    });
    return users;
  }

  // 查询单个 chatroom 所有信息
  async info(id: number) {
    const chatroom = await this.prismaService.chatroom.findUnique({
      where: {
        id,
      },
    });
    return { ...chatroom, users: await this.members(id) };
  }

  // 加入群聊
  async join(id: number, userId: number) {
    const chatroom = await this.prismaService.chatroom.findUnique({
      where: {
        id,
      },
    });
    if (!chatroom) {
      throw new BadRequestException('聊天室不存在');
    }
    if (chatroom.type === false) {
      throw new BadRequestException('一对一聊天室不能加人');
    }

    await this.prismaService.userChatroom.create({
      data: {
        userId,
        chatroomId: id,
      },
    });

    return '加入成功';
  }

  // 退出群聊
  async quit(id: number, userId: number) {
    // findUnique : 查询条件必须是具有“唯一性约束”的字段
    const chatroom = await this.prismaService.chatroom.findUnique({
      where: {
        id,
      },
    });
    if (!chatroom) {
      throw new BadRequestException('聊天室不存在');
    }
    if (chatroom.type === false) {
      throw new BadRequestException('一对一聊天室不能退出');
    }

    await this.prismaService.userChatroom.deleteMany({
      where: {
        userId,
        chatroomId: id,
      },
    });

    return '退出成功';
  }
}
