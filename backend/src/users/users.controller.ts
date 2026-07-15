import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'
import { UsersService } from './users.service'
import { ensureUploadSubDir, toPublicUploadUrl } from '../config/upload-path'
import { MiniappAuthGuard, MiniappRequestUser } from '../auth/miniapp-auth.guard'
import { CurrentMiniappUser } from '../auth/current-miniapp-user.decorator'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('wechat-login')
  async wechatLogin(@Body() body: { code: string; nickname?: string; avatarUrl?: string; gender?: string }) {
    return this.usersService.wechatLogin(body)
  }

  @Get('me/profile')
  @UseGuards(MiniappAuthGuard)
  async getMyProfile(@CurrentMiniappUser() user: MiniappRequestUser) {
    return this.usersService.getPrivateProfile(user.userId)
  }

  @Patch('me/profile')
  @UseGuards(MiniappAuthGuard)
  async updateMyProfile(@CurrentMiniappUser() user: MiniappRequestUser, @Body() body: any) {
    return this.usersService.updateProfile(user.userId, body)
  }

  @Get(':id/profile')
  @UseGuards(MiniappAuthGuard)
  async getProfile(@Param('id') id: string, @CurrentMiniappUser() user: MiniappRequestUser) {
    this.assertSelf(id, user.userId)
    return this.usersService.getPrivateProfile(id)
  }

  @Patch(':id/profile')
  @UseGuards(MiniappAuthGuard)
  async updateProfile(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentMiniappUser() user: MiniappRequestUser,
  ) {
    this.assertSelf(id, user.userId)
    return this.usersService.updateProfile(id, body)
  }

  @Post('me/avatar')
  @UseGuards(MiniappAuthGuard)
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
  async uploadMyAvatar(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded')
    return { url: toPublicUploadUrl('avatars', file.filename) }
  }

  @Post(':id/avatar')
  @UseGuards(MiniappAuthGuard)
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
  async uploadAvatar(@Param('id') id: string, @UploadedFile() file: any, @CurrentMiniappUser() user: MiniappRequestUser) {
    if (!id) throw new BadRequestException('userId is required')
    this.assertSelf(id, user.userId)
    if (!file) throw new BadRequestException('No file uploaded')
    return { url: toPublicUploadUrl('avatars', file.filename) }
  }

  @Get('me/journey')
  @UseGuards(MiniappAuthGuard)
  async getMyJourney(@CurrentMiniappUser() user: MiniappRequestUser) {
    return this.usersService.getJourney(user.userId)
  }

  @Get(':id/journey')
  @UseGuards(MiniappAuthGuard)
  async getJourney(@Param('id') id: string, @CurrentMiniappUser() user: MiniappRequestUser) {
    this.assertSelf(id, user.userId)
    return this.usersService.getJourney(id)
  }

  @Get('me/orders')
  @UseGuards(MiniappAuthGuard)
  async getMyOrders(@CurrentMiniappUser() user: MiniappRequestUser) {
    return this.usersService.getMyOrders(user.userId)
  }

  @Get('me/registrations')
  @UseGuards(MiniappAuthGuard)
  async getMyRegistrations(@CurrentMiniappUser() user: MiniappRequestUser) {
    return this.usersService.getMyRegistrations(user.userId)
  }

  @Get('me/registration-profile')
  @UseGuards(MiniappAuthGuard)
  async getRegistrationProfile(@CurrentMiniappUser() user: MiniappRequestUser) {
    return this.usersService.getRegistrationProfile(user.userId)
  }

  @Get('me/invoice-profile')
  @UseGuards(MiniappAuthGuard)
  async getInvoiceProfile(@CurrentMiniappUser() user: MiniappRequestUser) {
    return this.usersService.getInvoiceProfile(user.userId)
  }

  @Put('me/invoice-profile')
  @UseGuards(MiniappAuthGuard)
  async updateInvoiceProfile(
    @Body() body: any,
    @CurrentMiniappUser() user: MiniappRequestUser,
  ) {
    return this.usersService.saveInvoiceProfile(user.userId, body)
  }

  @Get('me/invoice-orders')
  @UseGuards(MiniappAuthGuard)
  async getInvoiceOrders(@CurrentMiniappUser() user: MiniappRequestUser) {
    return this.usersService.getInvoiceOrders(user.userId)
  }

  @Get('me/invoice-requests')
  @UseGuards(MiniappAuthGuard)
  async getInvoiceRequests(@CurrentMiniappUser() user: MiniappRequestUser) {
    return this.usersService.getInvoiceRequests(user.userId)
  }

  @Get('me/invoices')
  @UseGuards(MiniappAuthGuard)
  async getInvoicesAlias(@CurrentMiniappUser() user: MiniappRequestUser) {
    return this.usersService.getInvoiceRequests(user.userId)
  }

  @Post('me/invoice-requests')
  @UseGuards(MiniappAuthGuard)
  async createInvoiceRequest(
    @Body('orderId', ParseIntPipe) orderId: number,
    @CurrentMiniappUser() user: MiniappRequestUser,
  ) {
    return this.usersService.createInvoiceRequest(user.userId, orderId)
  }

  @Post('me/invoices')
  @UseGuards(MiniappAuthGuard)
  async createInvoiceAlias(
    @Body('orderId', ParseIntPipe) orderId: number,
    @CurrentMiniappUser() user: MiniappRequestUser,
  ) {
    return this.usersService.createInvoiceRequest(user.userId, orderId)
  }

  private assertSelf(pathUserId: string, tokenUserId: string) {
    if (pathUserId !== tokenUserId) throw new ForbiddenException('不能访问其他用户数据')
  }
}
