import { Controller, Get } from '@nestjs/common';
import { AppService } from '@/app.service';
import { RequireLogin } from '@/custom.decorator';

@Controller()
@RequireLogin()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('aaa')
  aaa() {
    return 'aaa';
  }

  @Get('bbb')
  bbb() {
    return 'bbb';
  }
}
