
'use client';

import * as React from 'react';
import { promises as fs } from 'fs';
import path from 'path';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Link as LinkIcon, Globe, Image as ImageIcon, MapPin, Clock } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getLogContentAction } from '../actions/logs';


interface RecentLog {
  timestamp: string;
  ip: string;
  device: string;
  address: string;
  coordinates: string;
  accuracy: string;
  mapLink: string;
  source: string;
}

interface LogStats {
  totalVisits: number;
  uniqueIps: number;
  recentLogs: RecentLog[];
  visitsInLast5Mins: number;
}

function parseValue(entry: string, label: string): string {
    const match = entry.match(new RegExp(`${label}: (.*)`));
    return match ? match[1].trim() : 'N/A';
}

async function getLogStats(content: string): Promise<LogStats> {
  try {
    const entries = content.split('--- [').filter(e => e.trim() !== '');

    const allIps = entries.map(e => parseValue(e, 'Địa chỉ IP')).filter(ip => ip !== 'N/A');
    const uniqueIps = new Set(allIps).size;
    
    const now = new Date().getTime();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    const recentLogs: RecentLog[] = [];
    let visitsInLast5Mins = 0;

    entries.forEach(entry => {
        const timestampMatch = entry.match(/^(.*?)\] MỚI TRUY CẬP/);
        if (timestampMatch) {
            const logDate = new Date(timestampMatch[1]);
            if (logDate.getTime() >= fiveMinutesAgo) {
                visitsInLast5Mins++;
            }

            // We still only want the last 10 for the table
            if (entries.length - entries.indexOf(entry) <= 10) {
                 recentLogs.push({
                    timestamp: logDate.toLocaleString('vi-VN'),
                    ip: parseValue(entry, 'Địa chỉ IP'),
                    device: parseValue(entry, 'Thiết bị'),
                    address: parseValue(entry, 'Địa chỉ'),
                    coordinates: parseValue(entry, 'Tọa độ'),
                    accuracy: parseValue(entry, 'Độ chính xác'),
                    mapLink: parseValue(entry, 'Link Google Maps'),
                    source: parseValue(entry, 'Nguồn'),
                });
            }
        }
    });

    return {
      totalVisits: entries.length,
      uniqueIps,
      recentLogs: recentLogs.reverse(),
      visitsInLast5Mins,
    };

  } catch (error) {
    return {
      totalVisits: 0,
      uniqueIps: 0,
      recentLogs: [],
      visitsInLast5Mins: 0,
    };
  }
}


export default function DashboardPage() {
  const [statsData, setStatsData] = React.useState<LogStats>({ totalVisits: 0, uniqueIps: 0, recentLogs: [], visitsInLast5Mins: 0 });
  const [loading, setLoading] = React.useState(true);

  const fetchStats = React.useCallback(async () => {
    const content = await getLogContentAction();
    const stats = await getLogStats(content);
    setStatsData(stats);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchStats]);

  const statsCards = [
      { title: "Tổng Lượt Truy Cập", value: statsData.totalVisits.toLocaleString(), icon: Users },
      { title: "IP Duy Nhất", value: statsData.uniqueIps.toLocaleString(), icon: Globe },
      { title: "Người dùng trong 5 phút", value: statsData.visitsInLast5Mins.toLocaleString(), icon: Clock },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Tổng quan</h1>
        </header>

        <main className="flex-1 p-6">
            <div className="grid gap-4 md:grid-cols-3">
                {statsCards.map((stat) => (
                    <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                        {stat.title}
                        </CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "..." : stat.value}</div>
                    </CardContent>
                    </Card>
                ))}
            </div>
            
            <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Hoạt động Gần đây</CardTitle>
                        <CardDescription>Hiển thị 10 lượt truy cập gần nhất. Tự động làm mới sau 5 giây.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Thời gian</TableHead>
                                    <TableHead>Địa chỉ IP</TableHead>
                                    <TableHead>Địa chỉ / Vị trí</TableHead>
                                    <TableHead className="hidden lg:table-cell">Thiết bị</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                     <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            Đang tải dữ liệu...
                                        </TableCell>
                                    </TableRow>
                                ) : statsData.recentLogs.length > 0 ? (
                                    statsData.recentLogs.map((log, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                                            <TableCell className="font-mono text-xs">
                                                <div className="flex items-center gap-2">
                                                    <span>{log.ip}</span>
                                                    {log.source === 'image' && <Badge variant="secondary" className="gap-1"><ImageIcon className="h-3 w-3" />Ảnh</Badge>}
                                                    {log.source === 'link' && <Badge variant="outline" className="gap-1"><LinkIcon className="h-3 w-3"/>Link</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="font-medium truncate max-w-xs">{log.address}</div>
                                                {log.coordinates !== 'N/A' && log.mapLink !== 'N/A' ? (
                                                    <a
                                                      href={log.mapLink}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-xs text-muted-foreground font-mono cursor-pointer hover:text-primary flex items-center gap-1 w-fit"
                                                    >
                                                      <MapPin className="h-3 w-3" />
                                                      <span>{log.coordinates} (acc: {log.accuracy})</span>
                                                    </a>
                                                ) : (
                                                     <div className="text-xs text-muted-foreground italic">Không có dữ liệu vị trí</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground truncate max-w-sm">{log.device}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            Chưa có hoạt động nào được ghi lại.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
