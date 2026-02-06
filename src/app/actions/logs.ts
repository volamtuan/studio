
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const logFile = path.join(process.cwd(), 'logs', 'tracking_logs.txt');

// Interfaces for parsed data
export interface LogEntry {
  timestamp: string;
  source: string;
  device: string;
  ip: string;
  coordinates: string;
  accuracy: string;
  address: string;
  mapLink: string;
  language: string;
  timezone: string;
  redirectUrl?: string;
  timestampISO: string;
}

export interface RecentLog extends Omit<LogEntry, 'timestampISO'> {}

export interface LogStats {
  totalVisits: number;
  uniqueIps: number;
  recentLogs: RecentLog[];
  visitsInLast5Mins: number;
}


// --- Basic Actions ---

export async function deleteLogsAction() {
  try {
    await fs.writeFile(logFile, '');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true, message: 'Logs cleared successfully.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to clear logs: ${message}` };
  }
}


// --- Server-side Parsing and Analysis Actions ---

function parseValue(entry: string, label: string): string {
  const match = entry.match(new RegExp(`${label}: (.*)`));
  return match ? match[1].trim() : 'N/A';
}

async function readAndParseLogs(): Promise<{ logs: LogEntry[], rawContent: string }> {
  let content = "";
  try {
    content = await fs.readFile(logFile, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        await fs.writeFile(logFile, '', 'utf-8');
        return { logs: [], rawContent: "Log file did not exist and has been created. It is currently empty." };
      } catch (writeError) {
         return { logs: [], rawContent: "Log file does not exist and could not be created." };
      }
    }
     return { logs: [], rawContent: "Could not read log file." };
  }

  if (!content || content.trim() === '') {
    return { logs: [], rawContent: content };
  }

  const entries = content.split('--- [').filter(e => e.trim() !== '');
  
  const allLogs: LogEntry[] = entries.map(entry => {
    const timestampMatch = entry.match(/^(.*?)\] MỚI TRUY CẬP/);
    const dateObj = timestampMatch ? new Date(timestampMatch[1]) : null;
    return {
        timestamp: dateObj ? dateObj.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'N/A',
        timestampISO: dateObj ? dateObj.toISOString() : new Date(0).toISOString(),
        source: parseValue(entry, 'Nguồn'),
        device: parseValue(entry, 'Thiết bị'),
        ip: parseValue(entry, 'Địa chỉ IP'),
        coordinates: parseValue(entry, 'Tọa độ'),
        accuracy: parseValue(entry, 'Độ chính xác'),
        address: parseValue(entry, 'Địa chỉ'),
        mapLink: parseValue(entry, 'Link Google Maps'),
        language: parseValue(entry, 'Ngôn ngữ'),
        timezone: parseValue(entry, 'Múi giờ'),
        redirectUrl: parseValue(entry, 'Chuyển hướng đến'),
    };
  });

  return { logs: allLogs.reverse(), rawContent: content }; // Newest first
}


export async function getParsedLogsAction(): Promise<{ logs: LogEntry[], rawContent: string }> {
  return readAndParseLogs();
}


export async function getLogStatsAction(): Promise<LogStats> {
  const { logs: allParsedLogs } = await readAndParseLogs();

  if (allParsedLogs.length === 0) {
     return {
      totalVisits: 0,
      uniqueIps: 0,
      recentLogs: [],
      visitsInLast5Mins: 0,
    };
  }

  const allIps = allParsedLogs.map(log => log.ip).filter(ip => ip !== 'N/A');
  const uniqueIps = new Set(allIps).size;
  
  const now = new Date().getTime();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  const visitsInLast5Mins = allParsedLogs.filter(log => {
      const logDate = new Date(log.timestampISO);
      return logDate.getTime() >= fiveMinutesAgo;
  }).length;

  const recentLogs = allParsedLogs.slice(0, 10).map(log => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { timestampISO, ...rest } = log; // remove temporary ISO timestamp
    return rest;
  });

  return {
    totalVisits: allParsedLogs.length,
    uniqueIps,
    recentLogs,
    visitsInLast5Mins,
  };
}

    