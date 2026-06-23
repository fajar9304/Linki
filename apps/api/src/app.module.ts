import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { RedirectController } from './redirect.controller';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { ScraperService } from './products/scraper.service';

@Module({
  imports: [],
  controllers: [AppController, RedirectController, CategoriesController, ProductsController],
  providers: [AppService, PrismaService, CategoriesService, ProductsService, ScraperService],
})
export class AppModule {}
