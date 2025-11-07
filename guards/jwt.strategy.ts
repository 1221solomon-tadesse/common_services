import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    console.log('JwtStrategy initialized, secret present', secret);
  }

  // Called automatically when a valid JWT is found
  async validate(payload: any) {
    console.log('JWT payload:', payload);
    // Map the JWT payload to the user object that will be attached to request.user
    return {
      userId: payload.userId,       // match your token payload
      sessionId: payload.sessionId, // optional if needed
    };
  }
}
