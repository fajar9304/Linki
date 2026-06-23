import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'linki-default-jwt-secret-key-12345';

  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const emailLower = dto.email.toLowerCase().trim();
    const usernameLower = dto.username.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailLower },
          { username: usernameLower }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === emailLower) {
        throw new ConflictException('Email sudah terdaftar');
      }
      throw new ConflictException('Username sudah digunakan');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: emailLower,
        username: usernameLower,
        passwordHash,
        themeConfig: {
          backgroundColor: '#F0F3F7',
          cardColor: '#FFFFFF',
          primaryColor: '#00AA5B',
          primaryLightColor: '#E5F7EE',
        }
      }
    });

    return {
      message: 'Registrasi berhasil',
      userId: user.id,
      username: user.username,
    };
  }

  async login(dto: LoginDto) {
    const identityLower = dto.identity.toLowerCase().trim();

    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identityLower },
          { username: identityLower }
        ]
      }
    });

    if (!user) {
      throw new UnauthorizedException('Email, username, atau password salah');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email, username, atau password salah');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      this.jwtSecret,
      { expiresIn: '7d' } // Token valid for 7 days
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        themeConfig: user.themeConfig,
      }
    };
  }
}
