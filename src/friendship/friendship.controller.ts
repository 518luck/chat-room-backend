import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { FriendshipService } from '@/friendship/friendship.service';
import { FriendAddDto } from '@/friendship/dto/friend-add.dto';
import { RequireLogin, UserInfo } from '@/custom.decorator';

@Controller('friendship')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  // 添加好友
  @Post('add')
  @RequireLogin()
  add(@Body() friendAddDto: FriendAddDto, @UserInfo('userId') userId: number) {
    return this.friendshipService.add(friendAddDto, userId);
  }

  // 请求列表
  @Get('request_list')
  @RequireLogin()
  list(@UserInfo('userId') userId: number) {
    return this.friendshipService.list(userId);
  }

  // 同意好友请求
  @Get('agree/:id')
  @RequireLogin()
  agree(@Param('id') friendId: number, @UserInfo('userId') userId: number) {
    if (!friendId) {
      throw new BadRequestException('添加的好友 id 不能为空');
    }
    return this.friendshipService.agree(friendId, userId);
  }

  // 拒绝好友请求
  @Get('reject/:id')
  reject(@Param('id') friendId: number, @UserInfo('userId') userId: number) {
    if (!friendId) {
      throw new BadRequestException('添加的好友 id 不能为空');
    }
    return this.friendshipService.reject(friendId, userId);
  }

  // 获取用户好友关系
  @Get('list')
  @RequireLogin()
  friendship(@UserInfo('userId') userId: number, @Query('name') name: string) {
    return this.friendshipService.getFriendship(userId, name);
  }

  // 移除好友
  @Get('remove/:id')
  @RequireLogin()
  remove(@Param('id') friendId: number, @UserInfo('userId') userId: number) {
    return this.friendshipService.remove(friendId, userId);
  }
}
