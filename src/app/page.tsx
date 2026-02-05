
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

  const apiIpParam = (ip === '127.0.0.1' || ip === '::1') ? '' : ip;
  const fields = 'status,query,country,regionName,city,isp,org,proxy,reverse,lat,lon';
  let logData = `--- [${new Date().toISOString()}] MỚI TRUY CẬP ---\n`;

  try {
    const response = await fetch(`http://ip-api.com/json/${apiIpParam}?fields=${fields}`);
    const ipData = await response.json();

    if (ipData && ipData.status === 'success') {
      let finalIp = ipData.query || ip;
      if (finalIp.startsWith('::ffff:')) {
        finalIp = finalIp.substring(7);
      }

      const { lat, lon, city, isp, proxy, country, regionName, org, reverse } = ipData;
      const is_vpn = proxy ? 'Yes' : 'No';
      const maps_link = (lat && lon) ? `https://www.google.com/maps?q=${lat},${lon}` : 'N/A';
      
      logData += `Địa chỉ IP: ${finalIp}\n`;
      logData += `Tên máy chủ: ${reverse || 'N/A'}\n`;
      logData += `Thiết bị: ${ua}\n`;
      logData += `Nhà cung cấp: ${isp || 'N/A'}\n`;
      logData += `Đơn vị: ${org || 'N/A'}\n`;
      logData += `Quốc gia: ${country || 'N/A'}\n`;
      logData += `Khu vực: ${regionName || 'N/A'}\n`;
      logData += `Vị trí (ước tính): ${city || 'N/A'}\n`;
      logData += `VPN/Proxy: ${is_vpn}\n`;
      logData += `Link Maps (ước tính): ${maps_link}\n`;

    } else {
        let finalIp = ip;
        if (finalIp.startsWith('::ffff:')) {
          finalIp = finalIp.substring(7);
        }
        logData += `Địa chỉ IP: ${finalIp}\nThiết bị: ${ua}\n`;
        logData += `Không thể lấy thông tin chi tiết cho IP.\n`
    }
  } catch (error) {
    console.error('Failed to fetch IP API data:', error);
    let finalIp = ip;
    if (finalIp.startsWith('::ffff:')) {
      finalIp = finalIp.substring(7);
    }
    logData += `Địa chỉ IP: ${finalIp}\nThiết bị: ${ua}\n`;
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
