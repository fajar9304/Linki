import { Controller, Patch, Body, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../prisma.service';
import { UpdateProfileDto } from './dto/profile.dto';

@Controller('api/creator')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly prisma: PrismaService) {}

  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const userId = req.user.id;

    // 1. Fetch current user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }

    // 2. Parse current theme config
    const currentTheme = (user.themeConfig as any) || {};

    // 3. Construct new theme configuration
    const updatedTheme = {
      ...currentTheme,
      ...(dto.displayName !== undefined && { displayName: dto.displayName }),
      ...(dto.bio !== undefined && { bio: dto.bio }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      ...(dto.backgroundColor !== undefined && { backgroundColor: dto.backgroundColor }),
      ...(dto.cardColor !== undefined && { cardColor: dto.cardColor }),
      ...(dto.primaryColor !== undefined && { primaryColor: dto.primaryColor }),
      ...(dto.primaryLightColor !== undefined && { primaryLightColor: dto.primaryLightColor }),
    };

    // 4. Update in database
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        themeConfig: updatedTheme,
      },
      select: {
        id: true,
        username: true,
        email: true,
        themeConfig: true,
      },
    });

    return {
      message: 'Profil berhasil diperbarui',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        themeConfig: updatedUser.themeConfig,
      },
    };
  }
}
