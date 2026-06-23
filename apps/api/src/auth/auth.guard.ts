import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtSecret = process.env.JWT_SECRET || 'linki-default-jwt-secret-key-12345';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Format header otorisasi tidak valid');
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string; username: string };
      
      (request as any).user = {
        id: decoded.userId,
        username: decoded.username,
      };
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token kedaluwarsa atau tidak valid');
    }
  }
}
