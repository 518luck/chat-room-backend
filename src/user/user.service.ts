import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { RegisterUserDto } from '@/user/dto/register-user.dto';
import { LoginUserDto } from '@/user/dto/login-user.dto';
import { UpdateUserPasswordDto } from '@/user/dto/update-user-password.dto';
import { UpdateUserDto } from '@/user/dto/udpate-user.dto';
import { Prisma } from '@prisma-client';

type SelectedUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    username: true;
    nickName: true;
    email: true;
  };
}>;

@Injectable()
export class UserService {
  @Inject(PrismaService)
  private prismaService: PrismaService;

  @Inject(RedisService)
  private redisService: RedisService;

  private logger = new Logger();

  // 注册用户
  async create(user: RegisterUserDto) {
    // 校验验证码
    const captcha = await this.redisService.get(`captcha_${user.email}`);

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (user.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    // 校验用户名是否存在
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: user.username,
      },
    });

    if (foundUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST);
    }

    try {
      return await this.prismaService.user.create({
        data: {
          username: user.username,
          password: user.password,
          nickName: user.nickName,
          email: user.email,
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
    } catch (e) {
      this.logger.error(e, UserService);
      return null;
    }
  }

  // 用户登录
  async login(loginUserDto: LoginUserDto) {
    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: loginUserDto.username,
      },
    });

    if (!foundUser) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (foundUser.password !== loginUserDto.password) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = foundUser;

    return result;
  }

  // 查询用户详情(用来返现)
  async findUserDetailById(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
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
    return user;
  }

  // 更新用户密码
  async updatePassword(passwordDto: UpdateUserPasswordDto) {
    // 校验验证码
    const captcha = await this.redisService.get(
      `update_password_captcha_${passwordDto.email}`,
    );

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (passwordDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.prismaService.user.findUnique({
      where: {
        username: passwordDto.username,
      },
    });

    if (!foundUser) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    foundUser.password = passwordDto.password;

    try {
      await this.prismaService.user.update({
        where: {
          id: foundUser.id,
        },
        data: foundUser,
      });
      return '密码修改成功';
    } catch (e) {
      this.logger.error(e, UserService);
      return '密码修改失败';
    }
  }

  // 更新用户信息
  async update(userId: number, updateUserDto: UpdateUserDto) {
    const captcha = await this.redisService.get(
      `update_user_captcha_${updateUserDto.email}`,
    );

    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }

    if (updateUserDto.captcha !== captcha) {
      throw new HttpException('验证码不正确', HttpStatus.BAD_REQUEST);
    }

    const foundUser = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!foundUser) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }

    if (updateUserDto.nickName) {
      foundUser.nickName = updateUserDto.nickName;
    }

    if (updateUserDto.headPic) {
      foundUser.headPic = updateUserDto.headPic;
    }

    try {
      await this.prismaService.user.update({
        where: {
          id: userId,
        },
        data: foundUser,
      });
      return '用户信息修改成功';
    } catch (e) {
      this.logger.error(e, UserService);
      return '用户信息修改成功';
    }
  }

  // 获取用户好友列表
  async getFriendship(userId: number) {
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

    return res;
  }
}
