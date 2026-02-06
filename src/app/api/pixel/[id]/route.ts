
import { getPixelLinksAction } from '@/app/actions/pixel-links';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { sendTelegramNotification } from '@/lib/server-utils';

async function logAccess(linkId: string, title: string, imageUrl: string) {
    const headersList = headers();
    const ua = headersList.get('user-agent') ?? 'unknown';
    const clientIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'N/A';
    const finalIp = clientIp.startsWith('::ffff:') ? clientIp.substring(7) : clientIp;
    const language = headersList.get('accept-language')?.split(',')[0];
    const timestamp = new Date().toISOString();
    
    // Using a different source to distinguish in logs
    let logData = `--- [${timestamp}] MỚI TRUY CẬP ---\n`;
    logData += `Nguồn: pixel_tracker\n`;
    logData += `Thiết bị: ${ua}\n`;
    logData += `Địa chỉ IP: ${finalIp}\n`;
    logData += `Ngôn ngữ: ${language || 'N/A'}\n`;
    logData += `Múi giờ: N/A\n`;
    logData += `Tọa độ: N/A\n`;
    logData += `Độ chính xác: N/A\n`;
    logData += `Địa chỉ: ${title}\n`; // Use address field for title
    logData += `Link Google Maps: ${imageUrl}\n`; // Use maps link for the served image url
    logData += `----------------------------------\n`;

    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'tracking_logs.txt');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logFile, logData, 'utf-8');

    let telegramMessage = `*🔔 Pixel được xem!*\n\n`;
    telegramMessage += `*Tiêu đề:* \`${title}\`\n`;
    telegramMessage += `*Thời gian:* \`${new Date(timestamp).toLocaleString('vi-VN')}\`\n`;
    telegramMessage += `*Địa chỉ IP:* \`${finalIp}\`\n`;
    telegramMessage += `*Ảnh được trả về:* ${imageUrl}\n`;
    
    sendTelegramNotification(telegramMessage);
}


export async function GET(request: Request, { params }: { params: { id: string } }) {
  // The param might come in as `some-id.png`, remove the extension.
  const id = params.id.replace(/\.png$/, '');

  const links = await getPixelLinksAction();
  const config = links.find(link => link.id === id);

  if (!config) {
    // Return a 1x1 transparent pixel if not found to avoid broken images
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    return new Response(pixel, {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  }

  // Log access in the background, don't await it
  logAccess(id, config.title, config.imageUrl);

  try {
    // Fetch the actual image
    const imageResponse = await fetch(config.imageUrl, { signal: AbortSignal.timeout(5000) });
    if (!imageResponse.ok || !imageResponse.body) {
        throw new Error('Failed to fetch image');
    }
    
    // Get content type from the original response
    const contentType = imageResponse.headers.get('content-type') || 'image/png';

    // Stream the image back to the client
    return new Response(imageResponse.body, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    });

  } catch (error) {
    // If fetching the real image fails, return the 1x1 transparent pixel
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    return new Response(pixel, {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  }
}
