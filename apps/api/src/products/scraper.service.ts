import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ScraperService {
  async scrapeMetadata(url: string) {
    try {
      // Detect platform
      const isShopee = /shopee\.(co\.id|sg|com)/i.test(url);
      const isTokopedia = /tokopedia\.com/i.test(url);

      let title = '';
      let imageUrl = '';
      let price = 0;

      if (isShopee) {
        // Try Shopee-specific extraction
        const shopeeData = await this.scrapeShopee(url);
        title = shopeeData.title;
        imageUrl = shopeeData.imageUrl;
        price = shopeeData.price;
      } else if (isTokopedia) {
        // Try Tokopedia-specific extraction
        const tokpedData = await this.scrapeTokopedia(url);
        title = tokpedData.title;
        imageUrl = tokpedData.imageUrl;
        price = tokpedData.price;
      }

      // Fallback to generic OG tags if platform-specific scraping returned nothing
      if (!title || !imageUrl) {
        const ogData = await this.scrapeOpenGraph(url);
        title = title || ogData.title;
        imageUrl = imageUrl || ogData.imageUrl;
        price = price || ogData.price;
      }

      return {
        success: !!(title || imageUrl),
        data: {
          title: title.trim(),
          imageUrl: imageUrl.trim(),
          price,
        },
        manualInputRequired: !title || !imageUrl,
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

  // --- Shopee-specific scraper ---
  private async scrapeShopee(url: string): Promise<{ title: string; imageUrl: string; price: number }> {
    let title = '';
    let imageUrl = '';
    let price = 0;

    try {
      // Method 1: Extract shopId and itemId from URL and use Shopee's item API
      const shopeeIds = this.extractShopeeIds(url);
      if (shopeeIds) {
        const apiUrl = `https://shopee.co.id/api/v4/item/get?shopid=${shopeeIds.shopId}&itemid=${shopeeIds.itemId}`;
        const apiRes = await axios.get(apiUrl, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://shopee.co.id/',
            'af-ac-enc-dat': '', // Required empty header for some Shopee API calls
          },
        });

        const item = apiRes.data?.data;
        if (item) {
          title = item.name || '';
          price = (item.price || item.price_min || 0) / 100000; // Shopee stores price in smallest unit
          // Shopee image hash -> full URL
          if (item.image) {
            imageUrl = `https://down-id.img.susercontent.com/file/${item.image}`;
          } else if (item.images && item.images.length > 0) {
            imageUrl = `https://down-id.img.susercontent.com/file/${item.images[0]}`;
          }
        }
      }
    } catch (apiErr) {
      console.warn(`Shopee API failed: ${apiErr.message}`);
    }

    // Method 2: Fallback to OG tags from HTML
    if (!title || !imageUrl) {
      try {
        const ogData = await this.scrapeOpenGraph(url);
        title = title || ogData.title;
        imageUrl = imageUrl || ogData.imageUrl;
        price = price || ogData.price;
      } catch (e) {
        // Silently ignore
      }
    }

    return { title, imageUrl, price };
  }

  // --- Tokopedia-specific scraper ---
  private async scrapeTokopedia(url: string): Promise<{ title: string; imageUrl: string; price: number }> {
    let title = '';
    let imageUrl = '';
    let price = 0;

    try {
      // Tokopedia uses SSR so OG tags usually work well
      const ogData = await this.scrapeOpenGraph(url);
      title = ogData.title;
      imageUrl = ogData.imageUrl;
      price = ogData.price;

      // Clean up Tokopedia title (remove "| Tokopedia" suffix)
      if (title.includes('|')) {
        title = title.split('|')[0].trim();
      }
      if (title.startsWith('Jual ')) {
        title = title.replace(/^Jual\s+/, '');
      }
    } catch (e) {
      console.warn(`Tokopedia scraping failed: ${e.message}`);
    }

    return { title, imageUrl, price };
  }

  // --- Generic Open Graph scraper ---
  private async scrapeOpenGraph(url: string): Promise<{ title: string; imageUrl: string; price: number }> {
    const response = await axios.get(url, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const imageUrl = $('meta[property="og:image"]').attr('content') || '';

    let price = 0;
    const priceMeta = $('meta[property="product:price:amount"]').attr('content') || $('meta[property="og:price:amount"]').attr('content');
    if (priceMeta) {
      price = parseFloat(priceMeta) || 0;
    }

    return { title: title.trim(), imageUrl: imageUrl.trim(), price };
  }

  // --- Helper: Extract Shopee shopId and itemId from URL ---
  private extractShopeeIds(url: string): { shopId: string; itemId: string } | null {
    try {
      // Pattern 1: shopee.co.id/product-name-i.SHOPID.ITEMID
      const iPattern = /i\.(\d+)\.(\d+)/;
      const iMatch = url.match(iPattern);
      if (iMatch) {
        return { shopId: iMatch[1], itemId: iMatch[2] };
      }

      // Pattern 2: shopee.co.id/product/SHOPID/ITEMID
      const productPattern = /\/product\/(\d+)\/(\d+)/;
      const productMatch = url.match(productPattern);
      if (productMatch) {
        return { shopId: productMatch[1], itemId: productMatch[2] };
      }

      // Pattern 3: from URL search params (extraParams might have info)
      // Some Shopee URLs have itemid in query params
      const urlObj = new URL(url);
      const shopId = urlObj.searchParams.get('shopid');
      const itemId = urlObj.searchParams.get('itemid');
      if (shopId && itemId) {
        return { shopId, itemId };
      }

      return null;
    } catch {
      return null;
    }
  }
}
