import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ScraperService {
  async scrapeMetadata(url: string) {
    try {
      const isShopee = /shopee\.(co\.id|sg|com)/i.test(url);
      const isTokopedia = /tokopedia\.com/i.test(url);

      let title = '';
      let imageUrl = '';
      let price = 0;

      if (isTokopedia) {
        // Tokopedia supports SSR - OG tags usually work
        try {
          const ogData = await this.scrapeOpenGraph(url);
          title = ogData.title;
          imageUrl = ogData.imageUrl;
          price = ogData.price;

          // Clean Tokopedia title
          if (title.includes('|')) title = title.split('|')[0].trim();
          if (title.startsWith('Jual ')) title = title.replace(/^Jual\s+/, '');
        } catch (e) {
          console.warn(`Tokopedia OG scraping failed: ${e.message}`);
        }
      }

      if (isShopee) {
        // Shopee is 100% client-side rendered - extract from URL
        const shopeeData = this.extractFromShopeeUrl(url);
        title = shopeeData.title;
        // Image cannot be scraped server-side from Shopee
        // Frontend will show instructions for manual image
      }

      // Fallback: try OG for unknown platforms
      if (!isShopee && !isTokopedia) {
        try {
          const ogData = await this.scrapeOpenGraph(url);
          title = title || ogData.title;
          imageUrl = imageUrl || ogData.imageUrl;
          price = price || ogData.price;
        } catch (e) {
          console.warn(`Generic OG scraping failed: ${e.message}`);
        }
      }

      // If we still have no title, try to extract from URL path
      if (!title) {
        title = this.extractTitleFromUrl(url);
      }

      return {
        success: !!(title),
        data: {
          title: title.trim(),
          imageUrl: imageUrl.trim(),
          price,
          platform: isShopee ? 'shopee' : isTokopedia ? 'tokopedia' : 'other',
        },
        manualInputRequired: !imageUrl, // Image often needs manual input for Shopee
      };
    } catch (error) {
      console.warn(`Scraping failed for URL: ${url}. Reason: ${error.message}`);
      return {
        success: false,
        data: {},
        manualInputRequired: true,
      };
    }
  }

  // --- Extract product name from Shopee URL slug ---
  private extractFromShopeeUrl(url: string): { title: string } {
    let title = '';

    try {
      const urlObj = new URL(url);
      const pathname = decodeURIComponent(urlObj.pathname);

      // URL pattern: /-Product-Name-Here-i.shopId.itemId
      const slugMatch = pathname.match(/^\/-?(.+)-i\.\d+\.\d+/);
      if (slugMatch) {
        title = slugMatch[1]
          .replace(/-/g, ' ')
          .trim();
        // Capitalize first letter of each word for readability
        title = title.replace(/\b\w/g, c => c.toUpperCase());
      }
    } catch (e) {
      // Silently fail
    }

    return { title };
  }

  // --- Extract title from generic URL path ---
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const path = decodeURIComponent(urlObj.pathname);
      // Get last path segment, clean it
      const segments = path.split('/').filter(Boolean);
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        return lastSegment
          .replace(/[-_]/g, ' ')
          .replace(/\.\w+$/, '') // remove file extension
          .replace(/\b\w/g, c => c.toUpperCase())
          .trim();
      }
    } catch {
      // ignore
    }
    return '';
  }

  // --- Generic Open Graph scraper (works for Tokopedia, etc) ---
  private async scrapeOpenGraph(url: string): Promise<{ title: string; imageUrl: string; price: number }> {
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content')
      || $('meta[name="title"]').attr('content')
      || $('title').text()
      || '';
    const imageUrl = $('meta[property="og:image"]').attr('content')
      || $('meta[name="twitter:image"]').attr('content')
      || '';

    let price = 0;
    const priceMeta = $('meta[property="product:price:amount"]').attr('content')
      || $('meta[property="og:price:amount"]').attr('content');
    if (priceMeta) {
      price = parseFloat(priceMeta) || 0;
    }

    return { title: title.trim(), imageUrl: imageUrl.trim(), price };
  }
}
