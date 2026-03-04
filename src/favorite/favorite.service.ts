import { Inject, Injectable } from '@nestjs/common';
import { ChatHistory, Favorite } from '@prisma-client';
import { PrismaService } from 'src/prisma/prisma.service';
// 定义单个收藏项的完整类型
export type FavoriteWithChatHistory = Favorite & {
  chatHistory: ChatHistory | null; // 因为 findUnique 可能查不到，所以加上 null
};
@Injectable()
export class FavoriteService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  // 获取用户的收藏列表
  // @param userId: 用户ID
  // @return: 返回用户的收藏列表，每条收藏包含对应的聊天记录内容
  async list(userId: number) {
    // 1. 根据用户ID查询该用户所有的收藏记录
    const favorites = await this.prismaService.favorite.findMany({
      where: {
        uerId: userId,
      },
    });

    // 2. 遍历每条收藏记录，查询对应的聊天记录内容
    const res: FavoriteWithChatHistory[] = [];
    for (let i = 0; i < favorites.length; i++) {
      // 根据 chatHistoryId 查询对应的聊天记录
      const chatHistory = await this.prismaService.chatHistory.findUnique({
        where: {
          id: favorites[i].chatHistoryId,
        },
      });
      // 将收藏记录和聊天记录组装成完整对象，添加到结果数组
      res.push({
        ...favorites[i],
        chatHistory,
      });
    }
    // 3. 返回完整的收藏列表（包含聊天记录内容）
    return res;
  }

  // 添加收藏
  // @param userId: 用户ID
  // @param chatHistoryId: 要收藏的聊天记录ID
  // @return: 返回创建的收藏记录
  async add(userId: number, chatHistoryId: number) {
    return this.prismaService.favorite.create({
      data: {
        uerId: userId,
        chatHistoryId,
      },
    });
  }

  // 删除收藏
  // @param id: 收藏记录ID
  // @return: 返回删除结果
  async del(id: number) {
    return this.prismaService.favorite.deleteMany({
      where: {
        id,
      },
    });
  }
}
