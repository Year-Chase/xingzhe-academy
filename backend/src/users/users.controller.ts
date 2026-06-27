import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('wechat-login')
  async wechatLogin(@Body() body: { code: string; nickname?: string; avatarUrl?: string; gender?: string }) {
    return this.usersService.wechatLogin(body)
  }

  @Get(':id/profile')
  async getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id)
  }

  @Patch(':id/profile')
  async updateProfile(@Param('id') id: string, @Body() body: any) {
    return this.usersService.updateProfile(id, body)
  }

  @Get(':id/journey')
  async getJourney(@Param('id') id: string) {
    return this.usersService.getJourney(id)
  }
}
