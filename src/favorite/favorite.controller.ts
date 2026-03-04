import { Controller, Get, Query } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { RequireLogin, UserInfo } from 'src/custom.decorator';

@Controller('favorite')
@RequireLogin()
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get('list')
  list(@UserInfo('userId') userId: number) {
    return this.favoriteService.list(userId);
  }

  @Get('add')
  add(
    @UserInfo('userId') userId: number,
    @Query('chatHistoryId') chatHistoryId: number,
  ) {
    return this.favoriteService.add(userId, chatHistoryId);
  }

  @Get('del')
  del(@Query('id') id: number) {
    return this.favoriteService.del(id);
  }
}
