import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('api/creator')
export class CreatorController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':username')
  async getCreatorProfile(@Param('username') username: string) {
    const usernameLower = username.toLowerCase().trim();

    // 1. Fetch user by username
    const user = await this.prisma.user.findUnique({
      where: { username: usernameLower },
      select: {
        id: true,
        username: true,
        themeConfig: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Kreator tidak ditemukan');
    }

    // 2. Log page view in background/asynchronously to avoid blocking response
    this.prisma.viewLog.create({
      data: {
        userId: user.id,
      },
    }).catch(err => {
      console.error('Failed to log creator view:', err);
    });

    // 3. Fetch categories
    const categories = await this.prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { orderIndex: 'asc' },
    });

    // 4. Fetch active products
    const products = await this.prisma.product.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        categories: {
          select: {
            categoryId: true,
          },
        },
      },
    });

    // Map products to match frontend expectations (categories as string array of category IDs)
    const mappedProducts = products.map((p) => ({
      id: p.id,
      title: p.title,
      originalUrl: p.originalUrl,
      affiliateUrl: p.affiliateUrl,
      imageUrl: p.imageUrl,
      price: Number(p.price),
      isActive: p.isActive,
      categories: p.categories.map((c) => c.categoryId),
    }));

    return {
      creator: {
        username: user.username,
        themeConfig: user.themeConfig,
      },
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        orderIndex: c.orderIndex,
      })),
      products: mappedProducts,
    };
  }
}
