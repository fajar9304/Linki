import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../prisma.service';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('summary')
  async getSummary(@Req() req: any) {
    const userId = req.user.id;

    // 1. Count total views
    const totalViews = await this.prisma.viewLog.count({
      where: { userId },
    });

    // 2. Count total clicks
    const totalClicks = await this.prisma.clickLog.count({
      where: { userId },
    });

    // 3. Calculate CTR
    const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    // 4. Breakdown clicks by device
    const deviceStats = await this.prisma.clickLog.groupBy({
      by: ['deviceType'],
      where: { userId },
      _count: {
        _all: true,
      },
    });

    // 5. Breakdown clicks by referrer
    const referrerStats = await this.prisma.clickLog.groupBy({
      by: ['referrer'],
      where: { userId },
      _count: {
        _all: true,
      },
    });

    // 6. Top products by clicks
    const productsWithClicks = await this.prisma.product.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            clickLogs: true,
          },
        },
      },
      orderBy: {
        clickLogs: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    return {
      totalViews,
      totalClicks,
      ctr: Number(ctr.toFixed(1)),
      deviceBreakdown: deviceStats.map(d => ({
        device: d.deviceType,
        count: d._count._all,
      })),
      referrerBreakdown: referrerStats.map(r => ({
        referrer: r.referrer,
        count: r._count._all,
      })),
      topProducts: productsWithClicks.map(p => ({
        id: p.id,
        title: p.title,
        clicks: p._count.clickLogs,
      })),
    };
  }
}
