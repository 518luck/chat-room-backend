import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { UserService } from '@/user/user.service';
import { RegisterUserDto } from '@/user/dto/register-user.dto';
import { RedisService } from '@/redis/redis.service';
import { EmailService } from '@/email/email.service';
import { LoginUserDto } from '@/user/dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { RequireLogin, UserInfo } from '@/custom.decorator';
import { UpdateUserPasswordDto } from '@/user/dto/update-user-password.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(EmailService)
  private emailService: EmailService;

  @Inject(JwtService)
  private jwtService: JwtService;

  // 注册用户
  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.create(registerUser);
  }

  // 获取注册验证码
  @Get('register-captcha')
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(`captcha_${address}`, code, 5 * 60);

    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  // 用户登录
  @Post('login')
  async userLogin(@Body() loginUser: LoginUserDto) {
    const user = await this.userService.login(loginUser);

    return {
      user,
      token: this.jwtService.sign(
        {
          userId: user.id,
          username: user.username,
        },
        {
          expiresIn: '7d',
        },
      ),
    };
  }

  // 查询用户详情(用来返现)
  @Get('info')
  @RequireLogin()
  info(@UserInfo('userId') userId: number) {
    return this.userService.findUserDetailById(userId);
  }

  // 更新用户密码
  @Post('update_password')
  updatePassword(@Body() passwordDto: UpdateUserPasswordDto) {
    return this.userService.updatePassword(passwordDto);
  }
}
