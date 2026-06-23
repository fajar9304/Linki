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
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { CreatorController } from './creator/creator.controller';
import { AnalyticsController } from './analytics/analytics.controller';
import { ProfileController } from './creator/profile.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
    RedirectController,
    CategoriesController,
    ProductsController,
    AuthController,
    CreatorController,
    AnalyticsController,
    ProfileController,
  ],
  providers: [
    AppService,
    PrismaService,
    CategoriesService,
    ProductsService,
    ScraperService,
    AuthService,
  ],
})
export class AppModule {}
