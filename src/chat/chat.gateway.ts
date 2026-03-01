import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
//引入 Socket.io 原生的类型定义，保证 TypeScript 的严谨性
import { Server, Socket } from 'socket.io';
import { ChatHistoryService } from '@/chat-history/chat-history.service';
import { Inject } from '@nestjs/common';

//定义“加入房间”时，前端必须传的数据结构
interface JoinRoomPayload {
  chatroomId: number;
  userId: number;
}

//定义“发送消息”时，前端必须传的数据结构
interface SendMessagePayload {
  sendUserId: number;
  chatroomId: number;
  message: {
    type: 'text' | 'image';
    content: string;
  };
}

//@WebSocketGateway 标记此类为 WS 处理中心。
//{ cors: { origin: '*' } } 是为了解决本地开发时前端端口不同导致的跨域问题。
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  // 依赖注入 ChatService。虽然当前代码还没用到，但为你后续保存聊天记录打下了基础。
  constructor(private readonly chatService: ChatService) {}

  @Inject(ChatHistoryService)
  private chatHistoryService: ChatHistoryService;

  //@WebSocketServer() 装饰器会帮你把底层的 Socket.io Server 实例挂载到 this.server 上。
  //注意区别：Server 代表“整个服务器（上帝视角）”，而 Socket 代表“单个用户的连接”。
  @WebSocketServer() server: Server;

  // 监听前端通过 socket.emit('joinRoom', data) 发来的事件
  @SubscribeMessage('joinRoom')
  // client 是当前发请求的这个用户的独立连接，payload 是前端传的数据
  joinRoom(client: Socket, payload: JoinRoomPayload): void {
    // Socket.io 的房间机制要求房间名必须是字符串 (String)
    const roomName = payload.chatroomId.toString();

    // 核心 API：让这个客户端“加入”到一个虚拟的房间里。
    // 加了 void 是告诉 TS/ESLint："我知道这是一个异步操作，但我不需要等它执行完毕或拿它的返回值"。
    void client.join(roomName);

    // 广播逻辑：
    // this.server.to(roomName) -> 选中这个房间里的所有人
    // .emit('message', {...}) -> 给他们发送一条名为 'message' 的系统通知
    this.server.to(roomName).emit('message', {
      type: 'joinRoom',
      userId: payload.userId,
    });
  }

  // 监听前端发出的 'sendMessage' 事件
  @SubscribeMessage('sendMessage')
  // @MessageBody() 装饰器显式告诉 NestJS：请把前端传来的数据提取出来塞给 payload
  async sendMessage(@MessageBody() payload: SendMessagePayload): Promise<void> {
    // 同样，提取目标房间号
    const roomName = payload.chatroomId.toString();

    // 保存聊天记录
    await this.chatHistoryService.add(payload.chatroomId, {
      content: payload.message.content,
      type: payload.message.type === 'image' ? 1 : 0,
      chatroomId: payload.chatroomId,
      senderId: payload.sendUserId,
    });

    // 广播逻辑：向指定的聊天室发送这条真实的消息。
    // 注意：这里的 this.server.to() 会发给房间里的【所有人】（包括发送者自己）。
    // 所以前端收到这条消息时，需要判断 userId 是不是自己，如果是自己，就渲染在右边，别人渲染在左边。
    this.server.to(roomName).emit('message', {
      type: 'sendMessage',
      userId: payload.sendUserId,
      message: payload.message,
    });
  }
}
