import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { MiniappRequestUser } from './miniapp-auth.guard'

export const CurrentMiniappUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): MiniappRequestUser => {
    return ctx.switchToHttp().getRequest().user as MiniappRequestUser
  },
)
