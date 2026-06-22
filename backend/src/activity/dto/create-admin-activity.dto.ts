export class CreateAdminActivityDto {
  title: string
  description?: string
  location: string
  city?: string
  startTime: string
  endTime?: string
  capacity: number
  coverImage?: string
  price?: number
  memberPrice?: number
  lifetimeMemberPrice?: number
  paymentMode?: string
}
