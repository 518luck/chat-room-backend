import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ChatroomService } from '@/chatroom/chatroom.service';
import { RequireLogin, UserInfo } from '@/custom.decorator';

@Controller('chatroom')
@RequireLogin()
export class ChatroomController {
  constructor(private readonly chatroomService: ChatroomService) {}

  // 创建一对一聊天房间
  @Get('create-one-to-one')
  oneToOne(
    @Query('friendId') friendId: number,
    @UserInfo('userId') userId: number,
  ) {
    if (!friendId) {
      throw new BadRequestException('聊天好友的 id 不能为空');
    }
    return this.chatroomService.createOneToOneChatroom(friendId, userId);
  }

  // 创建群聊房间
  @Get('create-group')
  group(@Query('name') name: string, @UserInfo('userId') userId: number) {
    return this.chatroomService.createGroupChatroom(name, userId);
  }

  // 查看所有群聊
  @Get('list')
  list(@UserInfo('userId') userId: number) {
    if (!userId) {
      throw new BadRequestException('userId 不能为空');
    }
    return this.chatroomService.list(userId);
  }

  //查询聊天室的所有用户
  @Get('members')
  members(@Query('chatroomId') chatroomId: number) {
    if (!chatroomId) {
      throw new BadRequestException('chatroomId 不能为空');
    }
    return this.chatroomService.members(chatroomId);
  }

  //查询单个 chatroom 所有信息
  @Get('info/:id')
  info(@Param('id') id: number) {
    if (!id) {
      throw new BadRequestException('id 不能为空');
    }
    return this.chatroomService.info(id);
  }

  // 加入群聊
  @Get('join/:id')
  join(@Param('id') id: number, @Query('joinUserId') joinUserId: number) {
    if (!id) {
      throw new BadRequestException('id 不能为空');
    }
    if (!joinUserId) {
      throw new BadRequestException('joinUserId 不能为空');
    }
    return this.chatroomService.join(id, joinUserId);
  }

  // 退出群聊
  @Get('quit/:id')
  quit(@Param('id') id: number, @Query('quitUserId') quitUserId: number) {
    if (!id) {
      throw new BadRequestException('id 不能为空');
    }
    if (!quitUserId) {
      throw new BadRequestException('quitUserId 不能为空');
    }
    return this.chatroomService.quit(id, quitUserId);
  }
}
