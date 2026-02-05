
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lon, acc } = body;

    if (lat === undefined || lon === undefined) {
      return NextResponse.json({ error: 'Missing location data' }, { status: 400 });
    }

    const maps_link = `https://www.google.com/maps?q=${lat},${lon}`;
    const gps_data = `Tọa độ: ${lat}, ${lon}\nĐộ chính xác: ${acc || 'N/A'}m\nLink Google Maps: ${maps_link}\n----------------------------------\n`;

    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'tracking_logs.txt');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFileSync(logFile, gps_data, 'utf-8');
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Failed to log location:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process request', details: errorMessage }, { status: 500 });
  }
}
