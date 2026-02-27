import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
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
}
