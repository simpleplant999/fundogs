import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { UserRole } from '@prisma/client';

export type JwtUserPayload = {
  sub: string;
  role: UserRole;
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev-insecure-change-me',
    });
  }

  validate(payload: JwtUserPayload): JwtUserPayload {
    if (!payload?.sub) throw new UnauthorizedException();
    return payload;
  }
}
