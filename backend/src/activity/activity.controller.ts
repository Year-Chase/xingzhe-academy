import { Controller, Get, Post, Param, Query, Body, ParseIntPipe } from '@nestjs/common' 
import { ActivityService } from './activity.service' 
import { ActivityFlowService } from './activity-flow.service' 

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
  ) { 
    const p = Math.max(1, parseInt(page) || 1) 
    const l = Math.min(100, Math.max(1, parseInt(limit) || 50)) 
    const { items, total } = await this.activitySvc.getAll(p, l) 
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
        effectivePrice: a.price ?? 0,
        effectivePriceLabel: '普通价',
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
      locationName: a.locationName || '',
      locationAddress: a.locationAddress || '',
      locationLat: a.locationLat ?? null,
      locationLng: a.locationLng ?? null,
      requiredUserInfoFields: requiredFields,
    }
  }
  
  @Get('activity/:id/status') 
  async getStatus( 
    @Param('id', ParseIntPipe) id: number, 
    @Query('userId') userId: string, 
  ) { 
    if (!userId) return { status: 'NOT_REGISTERED' } 
    return this.flow.getUserStatus(userId, id) 
  } 
    @Get('activity/:id/qr') 
    async getQR( 
      @Param('id', ParseIntPipe) id: number, 
      @Query('userId') userId: string, 
    ) { 
      if (!userId) return { error: 'userId is required' } 
      return this.flow.generateQR(userId, id) } 
      
      @Post('activity/:id/checkin') 
      async checkin( 
        @Param('id', ParseIntPipe) id: number, 
        @Body() body: { code: string }, 
      ) { 
        if (!body?.code) return { error: 'code is required in body' } 
        return this.flow.checkin(body.code) } 
        
        @Post('activity/:id/enroll-pay')
        async enrollPay(
          @Param('id', ParseIntPipe) id: number,
          @Query('userId') userId: string,
          @Body() body: any,
        ) {
          if (!userId) return { error: 'userId is required' }
          return this.flow.enrollPay(userId, id, body?.registrationInfo || undefined)
        } 
        
        @Get('activity/:id/participants') 
        async getParticipants( 
          @Param('id', ParseIntPipe) id: number, 
          @Query('userId') userId: string, 
        ) { 
          return this.flow.getParticipants(id, userId || '1') 
        } 
      }