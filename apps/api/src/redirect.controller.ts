import { Controller, Get, Param, Req, Res, Headers } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('r')
export class RedirectController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':username/:productId')
  async handleRedirect(
    @Param('username') username: string,
    @Param('productId') productId: string,
    @Req() req: any,
    @Res() res: any,
    @Headers('user-agent') userAgent: string,
    @Headers('referer') referer: string,
  ) {
    // 1. Fetch product & user to verify they exist
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
        user: {
          username: username,
        },
      },
      include: {
        user: true,
      },
    });

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // 2. Parse device type from User-Agent
    let deviceType = 'Desktop';
    const ua = userAgent ? userAgent.toLowerCase() : '';
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      deviceType = 'iOS';
    } else if (ua.includes('android')) {
      deviceType = 'Android';
    }

    // 3. Parse referrer source (e.g., Instagram, TikTok, etc.)
    let referrerSource = 'Direct';
    const ref = referer ? referer.toLowerCase() : '';
    if (ref.includes('instagram') || req.query.src === 'ig') {
      referrerSource = 'Instagram';
    } else if (ref.includes('tiktok') || req.query.src === 'tiktok') {
      referrerSource = 'TikTok';
    } else if (ref.includes('facebook') || req.query.src === 'fb') {
      referrerSource = 'Facebook';
    } else if (ref) {
      try {
        const url = new URL(referer);
        referrerSource = url.hostname;
      } catch {
        referrerSource = 'Other';
      }
    }

    // 4. Log the click asynchronously to avoid blocking the response (ClickHouse target / Postgres MVP)
    const viewerIpHash = req.ip ? Buffer.from(req.ip).toString('base64').substring(0, 16) : 'unknown';
    
    // We launch this without await to keep response time < 50ms
    this.prisma.clickLog.create({
      data: {
        productId: product.id,
        userId: product.user.id,
        viewerIpHash,
        deviceType,
        referrer: referrerSource,
      },
    }).catch((err: any) => {
      console.error('Failed to log click:', err);
    });

    // 5. Generate Deep Link Intent URLs based on E-commerce platform
    // Support Shopee, Tokopedia, TikTok Shop
    const affiliateUrl = product.affiliateUrl;
    let appIntentUrl = affiliateUrl; // Fallback

    if (affiliateUrl.includes('shopee.co.id') || affiliateUrl.includes('shp.ee')) {
      // Shopee Universal Scheme: shopee://
      // Android Intent format: intent://<path>#Intent;scheme=shopee;package=com.shopee.id;end
      // Example shopee web: https://shopee.co.id/product/123/456 -> shopee://product/123/456
      const shopeePath = affiliateUrl.replace('https://', '').replace('http://', '');
      appIntentUrl = `shopee://open?url=${encodeURIComponent(affiliateUrl)}`;
    } else if (affiliateUrl.includes('tokopedia.com') || affiliateUrl.includes('tokopedia.link')) {
      // Tokopedia Scheme: tokopedia://
      appIntentUrl = `tokopedia://open?url=${encodeURIComponent(affiliateUrl)}`;
    }

    // 6. Return Zero-Click UX redirect page
    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Membuka Produk...</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #0f172a;
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            text-align: center;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-left-color: #f43f5e;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          h1 {
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0 0 8px 0;
          }
          p {
            font-size: 0.875rem;
            color: #94a3b8;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
        <h1>Menuju Aplikasi Toko...</h1>
        <p>Anda akan dialihkan secara otomatis</p>

        <script>
          const appUrl = ${JSON.stringify(appIntentUrl)};
          const webUrl = ${JSON.stringify(affiliateUrl)};
          const isAndroid = /android/i.test(navigator.userAgent);
          const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

          // Android Intent khusus untuk memicu Shopee/Tokopedia langsung di in-app browser
          let redirectUrl = appUrl;
          if (isAndroid) {
            if (webUrl.includes('shopee.co.id') || webUrl.includes('shp.ee')) {
              // Format intent Android khusus Shopee untuk bypass in-app browser
              redirectUrl = "intent://open?url=" + encodeURIComponent(webUrl) + "#Intent;scheme=shopee;package=com.shopee.id;end";
            } else if (webUrl.includes('tokopedia.com') || webUrl.includes('tokopedia.link')) {
              // Format intent Android Tokopedia
              redirectUrl = "intent://open?url=" + encodeURIComponent(webUrl) + "#Intent;scheme=tokopedia;package=com.tokopedia.tkpd;end";
            }
          }

          // Catat waktu mulai
          const start = Date.now();

          // Coba buka aplikasi native
          window.location.href = redirectUrl;

          // Fallback mechanism: Jika dalam 800ms tab/aplikasi tidak berganti fokus, alihkan ke mobile web browser
          setTimeout(() => {
            if (Date.now() - start < 1500) {
              window.location.href = webUrl;
            }
          }, 800);
        </script>
      </body>
      </html>
    `;

    return res.type('html').send(html);
  }
}
