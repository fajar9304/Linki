import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly secretToken = process.env.API_SECRET_TOKEN || 'linki-secret-token';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (token !== this.secretToken) {
      throw new UnauthorizedException('Invalid secret token');
    }

    // Attach a mock user to the request for CRUD operations
    // In production, this would be retrieved from JWT payload or DB session
    (request as any).user = {
      id: process.env.MOCK_USER_ID || '00000000-0000-0000-0000-000000000000',
      username: 'default_creator',
    };

    return true;
  }
}
