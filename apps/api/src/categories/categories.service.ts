import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: { name: string; orderIndex: number }) {
    // Ensure the default user exists in database first for MVP convenience
    await this.ensureUserExists(userId);

    return this.prisma.category.create({
      data: {
        userId,
        name: data.name,
        orderIndex: data.orderIndex,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async update(userId: string, id: string, data: { name?: string; orderIndex?: number }) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      await this.prisma.user.create({
        data: {
          id: userId,
          username: 'default_creator',
          email: 'creator@linki.com',
          passwordHash: '$2b$10$xyz', // Placeholder
        },
      });
    }
  }
}
