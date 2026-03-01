import { Controller, Get, Inject, Query } from '@nestjs/common';
import * as Minio from 'minio';

@Controller('minio')
export class MinioController {
  @Inject('MINIO_CLIENT')
  private minioClient: Minio.Client;

  // 获取预签名上传 URL
  @Get('presignedUrl')
  presignedPutObject(@Query('name') name: string) {
    // 参数名解释 : 'chat-room'：目标存储桶名称 name：前端传来的文件名 3600：有效期（秒），即这张“准考证”在 1 小时内有效
    return this.minioClient.presignedPutObject('chat-room', name, 3600);
  }
}
