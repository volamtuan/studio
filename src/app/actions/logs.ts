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
}

export interface RecentLog extends LogEntry {}

export interface LogStats {
  totalVisits: number;
  uniqueIps: number;
  recentLogs: RecentLog[];
  visitsInLast5Mins: number;
}


// --- Basic Actions ---

export async function getLogContentAction() {
  try {
    const content = await fs.readFile(logFile, 'utf-8');
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        await fs.writeFile(logFile, '', 'utf-8');
        return "Log file did not exist and has been created. It is currently empty.";
      } catch (writeError) {
        return "Log file does not exist and could not be created.";
      }
    }
    return "Could not read log file.";
  }
}

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

export async function getParsedLogsAction(): Promise<LogEntry[]> {
  const content = await getLogContentAction();
  if (!content || content.trim() === '' || content.startsWith('Log file does not exist')) {
    return [];
  }
  const entries = content.split('--- [').filter(e => e.trim() !== '');
  
  const allLogs: LogEntry[] = entries.map(entry => {
    const timestampMatch = entry.match(/^(.*?)\] MỚI TRUY CẬP/);
    return {
        timestamp: timestampMatch ? new Date(timestampMatch[1]).toLocaleString('vi-VN') : 'N/A',
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

  return allLogs.reverse(); // Newest first
}


export async function getLogStatsAction(): Promise<LogStats> {
  const content = await getLogContentAction();

  if (!content || content.trim() === '' || content.startsWith('Log file does not exist')) {
     return {
      totalVisits: 0,
      uniqueIps: 0,
      recentLogs: [],
      visitsInLast5Mins: 0,
    };
  }

  const entries = content.split('--- [').filter(e => e.trim() !== '');
  const allIps = entries.map(e => parseValue(e, 'Địa chỉ IP')).filter(ip => ip !== 'N/A');
  const uniqueIps = new Set(allIps).size;
  
  const now = new Date().getTime();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  const allParsedLogs: RecentLog[] = entries.map(entry => {
    const timestampMatch = entry.match(/^(.*?)\] MỚI TRUY CẬP/);
    return {
      timestamp: timestampMatch ? new Date(timestampMatch[1]).toLocaleString('vi-VN') : 'N/A',
      timestampISO: timestampMatch ? new Date(timestampMatch[1]).toISOString() : new Date(0).toISOString(),
      ip: parseValue(entry, 'Địa chỉ IP'),
      device: parseValue(entry, 'Thiết bị'),
      address: parseValue(entry, 'Địa chỉ'),
      coordinates: parseValue(entry, 'Tọa độ'),
      accuracy: parseValue(entry, 'Độ chính xác'),
      mapLink: parseValue(entry, 'Link Google Maps'),
      source: parseValue(entry, 'Nguồn'),
      language: parseValue(entry, 'Ngôn ngữ'),
      timezone: parseValue(entry, 'Múi giờ'),
      redirectUrl: parseValue(entry, 'Chuyển hướng đến'),
    };
  }).reverse(); // Newest first

  const visitsInLast5Mins = allParsedLogs.filter(log => {
      const logDate = new Date(log.timestampISO as string);
      return logDate.getTime() >= fiveMinutesAgo;
  }).length;

  const recentLogs = allParsedLogs.slice(0, 10).map(log => {
    const { timestampISO, ...rest } = log; // remove temporary ISO timestamp
    return rest;
  });

  return {
    totalVisits: entries.length,
    uniqueIps,
    recentLogs,
    visitsInLast5Mins,
  };
}
