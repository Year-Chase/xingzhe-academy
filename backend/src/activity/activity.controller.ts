import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { ActivityService } from './activity.service' 
import { ActivityFlowService } from './activity-flow.service' 
import { MiniappAuthGuard, MiniappRequestUser } from '../auth/miniapp-auth.guard'
import { CurrentMiniappUser } from '../auth/current-miniapp-user.decorator'

@Controller() 
export class ActivityController { 
  constructor( 
    private readonly activitySvc: ActivityService, 
    private readonly flow: ActivityFlowService, 
  ) {} 
  
  @Get('health') 
  health() 
  { 
    return { status: 'ok', timestamp: new Date().toISOString() }
   } 
   
   @Get('activity')
   async getActivityList() {
     const list = await this.activitySvc.getList()
     const enriched: any[] = []

     for (const a of list) {
       const registeredCount = await this.flow.getRegisteredCount(a.id)

       enriched.push({
         id: a.id,
         title: a.title,
         description: a.description?.slice(0, 80) || '',
         location: a.location,
         startTime: a.startTime,
         capacity: a.capacity,
         registeredCount,
         coverImage: a.coverImage || '',
         effectivePrice: a.price ?? 0,
         effectivePriceLabel: '普通价',
       })
     }

     return enriched
   }
   
  // Must be BEFORE /activity/:id to avoid "all" matching :id 
  @Get('activity/all')
  async getAllActivities(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('ongoing') ongoingRaw: string,
  ) {
    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.min(100, Math.max(1, parseInt(limit) || 50))
    const ongoing = ongoingRaw === 'true' || ongoingRaw === '1'
    const { items, total } = await this.activitySvc.getAll(p, l, ongoing ? { ongoing: true } : undefined)
    const enriched = await Promise.all(
      items.map(async (a) => ({
        id: a.id,
        title: a.title,
        description: a.description?.slice(0, 80) || '',
        location: a.location,
        startTime: a.startTime,
        endTime: a.endTime,
        capacity: a.capacity,
        status: a.status,
        registeredCount: await this.flow.getRegisteredCount(a.id),
        coverImage: a.coverImage || '',
        imageUrls: a.imageUrls || null,
        effectivePrice: a.price ?? 0,
        effectivePriceLabel: '普通价',
        postpayDate: a.postpayDate || null,
      })),
    )
    return { items: enriched, total, page: p, limit: l } 
  } 
  
  @Get('activity/:id')
  async getActivityDetail(@Param('id', ParseIntPipe) id: number) {
    const a = await this.activitySvc.getDetail(id)
    const registeredCount = await this.flow.getRegisteredCount(id)
    let requiredFields: string[] = []
    try { const v = JSON.parse(a.requiredUserInfoFields || 'null'); requiredFields = Array.isArray(v) ? v : [] } catch {}
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      location: a.location,
      startTime: a.startTime,
      endTime: a.endTime,
      capacity: a.capacity,
      coverImage: a.coverImage || '',
      status: a.status,
      registeredCount,
      price: a.price ?? 0,
      memberPrice: a.memberPrice ?? 0,
      lifetimeMemberPrice: a.lifetimeMemberPrice ?? 0,
      paymentMode: a.paymentMode || 'FULL',
      prepayAmount: a.prepayAmount ?? 0,
      remainingAmount: a.remainingAmount ?? 0,
      remainingPayDate: a.remainingPayDate || null,
      effectivePrice: a.price ?? 0,
      effectivePriceLabel: '普通价',
      createdAt: a.createdAt,
      slogan: a.slogan || '',
      province: a.province || '',
      city: a.city || '',
      registrationStartTime: a.registrationStartTime || null,
      registrationEndTime: a.registrationEndTime || null,
      groupQrType: a.groupQrType || 'NONE',
      groupQrImageUrl: a.groupQrImageUrl || '',
      hasGroupQr: a.groupQrType && a.groupQrType !== 'NONE' && !!a.groupQrImageUrl,
      groupQrTitle: a.groupQrTitle || '加入活动群',
      groupQrDescription: a.groupQrDescription || '活动通知、集合安排和现场事项将在群内同步',
      memoryImages: a.memoryImages || null,
      memoryText: a.memoryText || null,
      // V2.8-B: activity content enhancement
      imageUrls: a.imageUrls || null,
      contentBlocks: a.contentBlocks || null,
      // V2.8-C: pricingRules — parse to friendly array (same as Admin toAdminItem)
      pricingRules: (() => { try { const v = JSON.parse(a.pricingRules || 'null'); return Array.isArray(v) ? v : null } catch { return null } })(),
      postpayDate: a.postpayDate || null,
      locationName: a.locationName || '',
      locationAddress: a.locationAddress || '',
      locationLat: a.locationLat ?? null,
      locationLng: a.locationLng ?? null,
      requiredUserInfoFields: requiredFields,
    }
  }
  
  @Get('activity/:id/status') 
  @UseGuards(MiniappAuthGuard)
  async getStatus( 
    @Param('id', ParseIntPipe) id: number, 
    @CurrentMiniappUser() user: MiniappRequestUser,
  ) { 
    return this.flow.getUserStatus(user.userId, id)
  } 
    @Get('activity/:id/qr') 
    @UseGuards(MiniappAuthGuard)
    async getQR( 
      @Param('id', ParseIntPipe) id: number, 
      @CurrentMiniappUser() user: MiniappRequestUser,
    ) { 
      return this.flow.getQRCodeForUser(user.userId, id)
    } 
        
        @Post('activity/:id/enroll-pay')
        @UseGuards(MiniappAuthGuard)
        async enrollPay(
          @Param('id', ParseIntPipe) id: number,
          @CurrentMiniappUser() user: MiniappRequestUser,
          @Body() body: any,
        ) {
          return this.flow.enrollPay(user.userId, id, body?.registrationInfo || undefined)
        } 
        
        @Get('activity/:id/participants')
        async getParticipants(
          @Param('id', ParseIntPipe) id: number,
        ) {
          return this.flow.getParticipants(id, '')
        }

        // ── V2.8-D: Postpay endpoints ──

        @Get('activity/:id/order-status')
        @UseGuards(MiniappAuthGuard)
        async getOrderStatus(
          @Param('id', ParseIntPipe) id: number,
          @CurrentMiniappUser() user: MiniappRequestUser,
        ) {
          return this.flow.getOrderByActivityAndUser(id, user.userId)
        }

        @Get('orders/my-postpay')
        @UseGuards(MiniappAuthGuard)
        async getMyPostpayOrders(@CurrentMiniappUser() user: MiniappRequestUser) {
          return this.flow.getUserPostpayOrders(user.userId)
        }

        @Get('activity/my/postpay-orders')
        @UseGuards(MiniappAuthGuard)
        async getMyPostpayOrdersAlias(@CurrentMiniappUser() user: MiniappRequestUser) {
          return this.flow.getUserPostpayOrders(user.userId)
        }

        @Post('orders/:orderId/postpay/mock-pay')
        @UseGuards(MiniappAuthGuard)
        async mockPostpay(
          @Param('orderId', ParseIntPipe) orderId: number,
          @CurrentMiniappUser() user: MiniappRequestUser,
        ) {
          return this.flow.mockCompletePostpay(orderId, user.userId)
        }
      }
