import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class ScraperService {
  async scrapeMetadata(url: string) {
    try {
      // Setup browser-like headers to reduce the chance of getting blocked immediately
      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract metadata values
      const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
      const imageUrl = $('meta[property="og:image"]').attr('content') || '';
      
      // Attempt to find price from common schema.org tags or return 0
      let price = 0;
      const priceMeta = $('meta[property="product:price:amount"]').attr('content') || $('meta[property="og:price:amount"]').attr('content');
      if (priceMeta) {
        price = parseFloat(priceMeta) || 0;
      }

      return {
        success: true,
        data: {
          title: title.trim(),
          imageUrl: imageUrl.trim(),
          price,
        },
        manualInputRequired: !title || !imageUrl,
      };
    } catch (error) {
      // Silently catch Cloudflare blocks, 403, 503, timeouts and return clean failure response
      console.warn(`Scraping failed for URL: ${url}. Reason: ${error.message}`);
      return {
        success: false,
        data: {},
        manualInputRequired: true,
      };
    }
  }
}
