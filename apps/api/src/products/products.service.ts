import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

import { IsString, IsNotEmpty, IsUrl, IsNumber, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  originalUrl!: string;

  @IsString()
  @IsNotEmpty()
  affiliateUrl!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  imageUrl!: string;

  @IsNumber()
  price!: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  originalUrl?: string;

  @IsString()
  @IsOptional()
  affiliateUrl?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        userId,
        originalUrl: data.originalUrl,
        affiliateUrl: data.affiliateUrl,
        title: data.title,
        imageUrl: data.imageUrl,
        price: data.price,
        isActive: data.isActive !== false,
        categories: data.categoryIds && data.categoryIds.length > 0 ? {
          create: data.categoryIds.map(catId => ({
            categoryId: catId
          }))
        } : undefined,
      },
      include: {
        categories: {
          select: {
            categoryId: true
          }
        }
      }
    });
  }

  async findAll(userId: string) {
    return this.prisma.product.findMany({
      where: { userId },
      include: {
        categories: {
          select: {
            categoryId: true
          }
        }
      }
    });
  }

  async findOne(userId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
      include: {
        categories: {
          select: {
            categoryId: true
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(userId: string, id: string, data: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Wrap update and relation sync in transaction if categories are updated
    return this.prisma.$transaction(async (tx: any) => {
      // If categoryIds is provided, clear old categories and insert new ones
      if (data.categoryIds) {
        await tx.productCategory.deleteMany({
          where: { productId: id }
        });

        if (data.categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: data.categoryIds.map(catId => ({
              productId: id,
              categoryId: catId
            }))
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: {
          originalUrl: data.originalUrl,
          affiliateUrl: data.affiliateUrl,
          title: data.title,
          imageUrl: data.imageUrl,
          price: data.price,
          isActive: data.isActive,
        },
        include: {
          categories: {
            select: {
              categoryId: true
            }
          }
        }
      });
    });
  }

  async remove(userId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
