import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class JwtRefreshGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.getToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing token, userId');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET_REFRESH 
      });

      if (!payload) throw new UnauthorizedException('Invalid token payload');
      request.headers['pyload'] = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Unauthorized access');
    }
  }

  private getToken(request: Request): string | undefined {
    const authorizationHeader = request.headers.authorization;
    if (!authorizationHeader) return undefined;
    const [type, token] = authorizationHeader.split(' ');
    return type === 'Refresh' ? token : undefined;
  }
}
