import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from '@/user/user.service';
import { RegisterUserDto } from '@/user/dto/register-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // 注册用户
  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.create(registerUser);
  }
}
