import { Inject, Injectable } from '@nestjs/common';
import { ChatHistory, User } from '@prisma-client';
import { PrismaService } from '@/prisma/prisma.service';

export type HistoryDto = Pick<
  ChatHistory,
  'chatroomId' | 'senderId' | 'type' | 'content'
>;

// 1. 先定义你要 select 的用户信息子集
type SelectedUser = Pick<
  User,
  'id' | 'username' | 'nickName' | 'email' | 'createTime' | 'headPic'
>;

// 2. 定义包含发送者信息的完整历史记录类型
type ChatHistoryWithSender = ChatHistory & {
  sender: SelectedUser | null; // findUnique 没找到时可能是 null
};

@Injectable()
export class ChatHistoryService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  // 获取聊天记录
  async list(chatroomId: number) {
    const history = await this.prismaService.chatHistory.findMany({
      where: {
        chatroomId,
      },
    });

    if (!history.length) {
      return [];
    }

    const res: ChatHistoryWithSender[] = [];

    for (let i = 0; i < history.length; i++) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: history[i].senderId,
        },
        select: {
          id: true,
          username: true,
          nickName: true,
          email: true,
          createTime: true,
          headPic: true,
        },
      });
      res.push({
        ...history[i],
        sender: user,
      });
    }
    return res;
  }

  // 添加聊天记录
  async add(chatroomId: number, history: HistoryDto) {
    return this.prismaService.chatHistory.create({
      data: history,
    });
  }
}
