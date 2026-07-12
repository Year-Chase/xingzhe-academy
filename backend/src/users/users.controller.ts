import { BadRequestException, Body, Controller, Get, Headers, Param, ParseIntPipe, Patch, Post, Put, Query, UnauthorizedException, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { UsersService } from './users.service'
import { ensureUploadSubDir, toPublicUploadUrl } from '../config/upload-path'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('wechat-login')
  async wechatLogin(@Body() body: { code: string; nickname?: string; avatarUrl?: string; gender?: string }) {
    return this.usersService.wechatLogin(body)
  }

  @Get(':id/profile')
  async getProfile(
    @Param('id') id: string,
    @Headers('x-user-id') headerUserId: string,
    @Headers('authorization') authorization: string,
  ) {
    if (headerUserId || authorization) {
      const uid = this.resolveAuthenticatedUserId(undefined, headerUserId, authorization)
      if (uid !== id) throw new UnauthorizedException('不能读取其他用户资料')
      return this.usersService.getPrivateProfile(id)
    }
    return this.usersService.getProfile(id)
  }

  @Patch(':id/profile')
  async updateProfile(@Param('id') id: string, @Body() body: any) {
    return this.usersService.updateProfile(id, body)
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        const dir = ensureUploadSubDir('avatars')
        cb(null, dir)
      },
      filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const fallbackExt = file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : '.jpg'
        cb(null, unique + (extname(file.originalname || '') || fallbackExt))
      },
    }),
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
        cb(new BadRequestException('Only jpg/jpeg/png/webp allowed'), false)
      } else {
        cb(null, true)
      }
    },
  }))
  async uploadAvatar(@Param('id') id: string, @UploadedFile() file: any) {
    if (!id) throw new BadRequestException('userId is required')
    if (!file) throw new BadRequestException('No file uploaded')
    return { url: toPublicUploadUrl('avatars', file.filename) }
  }

  @Get(':id/journey')
  async getJourney(@Param('id') id: string) {
    return this.usersService.getJourney(id)
  }

  @Get('me/orders')
  async getMyOrders(
    @Query('userId') userId: string,
    @Headers('x-user-id') headerUserId: string,
    @Headers('authorization') authorization: string,
  ) {
    const uid = this.resolveCurrentUserId(userId, headerUserId, authorization)
    return this.usersService.getMyOrders(uid)
  }

  @Get('me/registrations')
  async getMyRegistrations(
    @Query('userId') userId: string,
    @Headers('x-user-id') headerUserId: string,
    @Headers('authorization') authorization: string,
  ) {
    const uid = this.resolveCurrentUserId(userId, headerUserId, authorization)
    return this.usersService.getMyRegistrations(uid)
  }

  @Get('me/registration-profile')
  async getRegistrationProfile(
    @Query('userId') userId: string,
    @Headers('x-user-id') headerUserId: string,
    @Headers('authorization') authorization: string,
  ) {
    const uid = this.resolveAuthenticatedUserId(userId, headerUserId, authorization)
    return this.usersService.getRegistrationProfile(uid)
  }

  @Get('me/invoice-profile')
  async getInvoiceProfile(
    @Query('userId') userId: string,
    @Headers('x-user-id') headerUserId: string,
    @Headers('authorization') authorization: string,
  ) {
    const uid = this.resolveCurrentUserId(userId, headerUserId, authorization)
    return this.usersService.getInvoiceProfile(uid)
  }

  @Put('me/invoice-profile')
  async updateInvoiceProfile(
    @Body() body: any,
    @Query('userId') userId: string,
    @Headers('x-user-id') headerUserId: string,
    @Headers('authorization') authorization: string,
  ) {
    const uid = this.resolveCurrentUserId(userId, headerUserId, authorization)
    return this.usersService.saveInvoiceProfile(uid, body)
  }

  @Get('me/invoice-orders')
  async getInvoiceOrders(
    @Query('userId') userId: string,
    @Headers('x-user-id') headerUserId: string,
    @Headers('authorization') authorization: string,
  ) {
    const uid = this.resolveCurrentUserId(userId, headerUserId, authorization)
    return this.usersService.getInvoiceOrders(uid)
  }

  @Get('me/invoice-requests')
  async getInvoiceRequests(
    @Query('userId') userId: string,
    @Headers('x-user-id') headerUserId: string,
    @Headers('authorization') authorization: string,
  ) {
    const uid = this.resolveCurrentUserId(userId, headerUserId, authorization)
    return this.usersService.getInvoiceRequests(uid)
  }

  @Post('me/invoice-requests')
  async createInvoiceRequest(
    @Body('orderId', ParseIntPipe) orderId: number,
    @Query('userId') userId: string,
    @Headers('x-user-id') headerUserId: string,
    @Headers('authorization') authorization: string,
  ) {
    const uid = this.resolveCurrentUserId(userId, headerUserId, authorization)
    return this.usersService.createInvoiceRequest(uid, orderId)
  }

  private resolveCurrentUserId(queryUserId?: string, headerUserId?: string, authorization?: string): string {
    const userId = headerUserId || queryUserId
    if (!userId) throw new BadRequestException('userId is required')
    if (!authorization?.startsWith('Bearer ')) throw new BadRequestException('请先完成登录')
    return userId
  }

  private resolveAuthenticatedUserId(queryUserId?: string, headerUserId?: string, authorization?: string): string {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : ''
    const userId = (headerUserId || '').trim()
    if (!token || !userId) throw new UnauthorizedException('请先完成登录')
    if (!userId.startsWith('user_')) throw new UnauthorizedException('请先完成登录')
    if (!token.startsWith('xztok_') || !token.endsWith(`_${userId.slice(0, 12)}`)) throw new UnauthorizedException('请先完成登录')
    if (queryUserId && queryUserId !== userId) throw new UnauthorizedException('不能读取其他用户资料')
    return userId
  }
}
