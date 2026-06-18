import { Injectable } from '@nestjs/common'

interface User {
  id: number
  name: string
  role: string
}

@Injectable()
export class UsersService {
  private users: User[] = [
    { id: 1, name: '行者', role: 'admin' },
    { id: 2, name: '跑者', role: 'user' },
  ]

  getUsers(): User[] {
    return this.users
  }
}