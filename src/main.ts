import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换类型，比如把字符串 "10" 转成数字 10
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
