import { Global, Module } from '@nestjs/common';
import { MinioController } from './minio.controller';
import * as Minio from 'minio';

@Global()
@Module({
  providers: [
    {
      provide: 'MINIO_CLIENT',
      useFactory() {
        const client = new Minio.Client({
          endPoint: 'localhost',
          port: 9000,
          useSSL: false,
          accessKey: 'CUuRyzxPgPqQTUE8VxS8',
          secretKey: 'W0XFvTOV7du1aqlDc5hOdu2Guu70q5bAymAWSJLl',
        });
        return client;
      },
    },
  ],
  exports: ['MINIO_CLIENT'],
  controllers: [MinioController],
})
export class MinioModule {}
