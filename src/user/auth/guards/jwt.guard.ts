import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class JwtGuard implements CanActivate {

  constructor(private jwtService: JwtService, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try{
      const request = context.switchToHttp().getRequest<Request>();
      const token = this.getToken(request);
      
      if((await this.jwtService.decode(token)).exp < Math.floor(Date.now() / 1000))throw new UnauthorizedException('Token has expired');
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET_ACCESS
        });
        if (!payload) throw new UnauthorizedException('Invalid token payload');
        request['userid'] = payload.id;
        return true;
    }catch(e){
      throw new UnauthorizedException('Unauthorized');
    }
  }

  private getToken(request: Request): string | undefined {
    const authorizationHeader = request.headers.authorization;
    if (!authorizationHeader) return undefined;
    const [type, token] = authorizationHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
