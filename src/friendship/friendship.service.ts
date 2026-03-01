import { FriendAddDto } from './dto/friend-add.dto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FriendRequest, Prisma } from '@prisma-client';

type SelectedUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    username: true;
    nickName: true;
    email: true;
  };
}>;
type FriendRequestWithUser = FriendRequest & {
  fromUser?: SelectedUser | null;
  toUser?: SelectedUser | null;
};
@Injectable()
export class FriendshipService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  // 添加好友
  async add(friendAddDto: FriendAddDto, userId: number) {
    const friend = await this.prismaService.user.findUnique({
      where: {
        username: friendAddDto.username,
      },
    });

    if (!friend) {
      throw new BadRequestException('要添加的 username 不存在');
    }

    if (friend.id === userId) {
      throw new BadRequestException('不能添加自己为好友');
    }

    const found = await this.prismaService.friendship.findMany({
      where: {
        userId,
        friendId: friend.id,
      },
    });

    if (found.length) {
      throw new BadRequestException('该好友已经添加过');
    }

    return await this.prismaService.friendRequest.create({
      data: {
        fromUserId: userId,
        toUserId: friend.id,
        reason: friendAddDto.reason,
        status: 0,
      },
    });
  }

  // 请求列表
  async list(userId: number) {
    const fromMeRequest = await this.prismaService.friendRequest.findMany({
      where: {
        fromUserId: userId,
      },
    });

    const toMeRequest = await this.prismaService.friendRequest.findMany({
      where: {
        toUserId: userId,
      },
    });

    const res = {
      toMe: [] as FriendRequestWithUser[],
      fromMe: [] as FriendRequestWithUser[],
    };

    for (let i = 0; i < fromMeRequest.length; i++) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: fromMeRequest[i].toUserId,
        },
        select: {
          id: true,
          username: true,
          nickName: true,
          email: true,
          headPic: true,
          createTime: true,
        },
      });

      res.fromMe.push({
        ...fromMeRequest[i],
        toUser: user,
      });
    }

    for (let i = 0; i < toMeRequest.length; i++) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: toMeRequest[i].fromUserId,
        },
        select: {
          id: true,
          username: true,
          nickName: true,
          email: true,
          headPic: true,
          createTime: true,
        },
      });

      res.toMe.push({
        ...toMeRequest[i],
        fromUser: user,
      });
    }

    return res;
  }

  // 同意好友请求
  async agree(friendId: number, userId: number) {
    const result = await this.prismaService.friendRequest.updateMany({
      where: {
        fromUserId: +friendId,
        toUserId: +userId,
        status: 0,
      },
      data: {
        status: 1,
      },
    });
    if (result.count === 0) {
      return '请求不存在';
    }
    const res = await this.prismaService.friendship.findMany({
      where: {
        userId,
        friendId,
      },
    });

    if (!res.length) {
      await this.prismaService.friendship.create({
        data: {
          userId,
          friendId,
        },
      });
    } else {
      return '已添加';
    }
    return '添加成功';
  }

  // 拒绝好友请求
  async reject(friendId: number, userId: number) {
    await this.prismaService.friendRequest.updateMany({
      where: {
        fromUserId: friendId,
        toUserId: userId,
        status: 0,
      },
      data: {
        status: 2,
      },
    });
    return '已拒绝';
  }

  // 获取用户好友列表
  async getFriendship(userId: number, name: string) {
    //获取“关系网”
    const friends = await this.prismaService.friendship.findMany({
      //OR 运算符 在数据库里，好友关系是有方向的。如果你只查 userId: userId，你只能搜到你主动加的人；如果你只查 friendId: userId，你只能搜到主动加你的人。
      // 使用 OR 就像是拿着两张名单比对：
      //  条件 A (userId: userId)：找出所有“我加的人”。
      //  条件 B (friendId: userId)：找出所有“加我的人”。
      //  结果：只要满足其中任何一个条件，这条关系记录就会被放入 friends 数组中。
      where: {
        OR: [
          {
            userId: userId,
          },
          {
            friendId: userId,
          },
        ],
      },
    });

    //提取并去重
    const set = new Set<number>();
    for (let i = 0; i < friends.length; i++) {
      set.add(friends[i].userId);
      set.add(friends[i].friendId);
    }

    const friendIds = [...set].filter((item) => item !== userId);

    const res: SelectedUser[] = [];

    for (let i = 0; i < friendIds.length; i++) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: friendIds[i],
        },
        select: {
          id: true,
          username: true,
          nickName: true,
          email: true,
        },
      });

      if (user) {
        res.push(user);
      }
    }

    if (name) {
      return res.filter((item: SelectedUser) => item.nickName.includes(name));
    }
    return res;
  }

  // 移除好友
  async remove(friendId: number, userId: number) {
    await this.prismaService.friendship.deleteMany({
      where: {
        userId,
        friendId,
      },
    });
    return '删除成功';
  }
}
