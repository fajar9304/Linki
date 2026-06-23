import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CategoriesService } from './categories.service';

@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Req() req: any, @Body() body: { name: string; orderIndex: number }) {
    const userId = (req as any).user.id;
    return this.categoriesService.create(userId, body);
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = (req as any).user.id;
    return this.categoriesService.findAll(userId);
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; orderIndex?: number },
  ) {
    const userId = (req as any).user.id;
    return this.categoriesService.update(userId, id, body);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = (req as any).user.id;
    return this.categoriesService.remove(userId, id);
  }
}
