import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ProductsService, CreateProductDto, UpdateProductDto } from './products.service';
import { ScraperService } from './scraper.service';

@Controller('products')
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly scraperService: ScraperService,
  ) {}

  @Post('scrape')
  async scrape(@Body() body: { url: string }) {
    return this.scraperService.scrapeMetadata(body.url);
  }

  @Post()
  async create(@Req() req: any, @Body() body: CreateProductDto) {
    const userId = (req as any).user.id;
    return this.productsService.create(userId, body);
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = (req as any).user.id;
    return this.productsService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = (req as any).user.id;
    return this.productsService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
  ) {
    const userId = (req as any).user.id;
    return this.productsService.update(userId, id, body);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = (req as any).user.id;
    return this.productsService.remove(userId, id);
  }
}
