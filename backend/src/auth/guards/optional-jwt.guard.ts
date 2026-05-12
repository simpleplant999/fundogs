import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtUserPayload } from '../jwt.strategy';

@Injectable()
export class OptionalJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: JwtUserPayload;
    }>();
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return true;
    try {
      const token = auth.slice(7);
      const payload = this.jwt.verify<JwtUserPayload>(token);
      req.user = payload;
    } catch {
      /* ignore invalid token for optional auth */
    }
    return true;
  }
}
