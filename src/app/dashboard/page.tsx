
import { promises as fs } from 'fs';
import path from 'path';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, MapPin, Link as LinkIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const logFile = path.join(process.cwd(), 'logs', 'tracking_logs.txt');

interface RecentLog {
  timestamp: string;
  device: string;
  address: string;
  coordinates: string;
  accuracy: string;
  mapLink: string;
}

function parseValue(entry: string, label: string): string {
    const match = entry.match(new RegExp(`${label}: (.*)`));
    return match ? match[1].trim() : 'N/A';
}

async function getLogStats() {
  try {
    const content = await fs.readFile(logFile, 'utf-8');
    const entries = content.split('--- [').filter(e => e.trim() !== '');

    const locationsLogged = entries.filter(e => /Tọa độ:/.test(e)).length;
    
    const recentLogs: RecentLog[] = entries.slice(-10).reverse().map(entry => {
      const timestampMatch = entry.match(/^(.*?)\] MỚI TRUY CẬP/);
      return { 
        timestamp: timestampMatch ? new Date(timestampMatch[1]).toLocaleString('vi-VN') : 'N/A',
        device: parseValue(entry, 'Thiết bị'),
        address: parseValue(entry, 'Địa chỉ'),
        coordinates: parseValue(entry, 'Tọa độ'),
        accuracy: parseValue(entry, 'Độ chính xác'),
        mapLink: parseValue(entry, 'Link Google Maps'),
      };
    });

    return {
      totalVisits: entries.length,
      locationsLogged,
      recentLogs
    };

  } catch (error) {
    // If file does not exist or other error
    return {
      totalVisits: 0,
      locationsLogged: 0,
      recentLogs: []
    };
  }
}


export default async function DashboardPage() {
  const statsData = await getLogStats();

  const statsCards = [
      { title: "Total Visits", value: statsData.totalVisits.toLocaleString(), icon: Users },
      { title: "Locations Logged", value: statsData.locationsLogged.toLocaleString(), icon: MapPin },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Dashboard</h1>
        </header>

        <main className="flex-1 p-6">
            <div className="grid gap-4 md:grid-cols-2">
                {statsCards.map((stat) => (
                    <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                        {stat.title}
                        </CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                    </Card>
                ))}
            </div>
            
            <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Showing the last 10 location-enabled visits.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead className="hidden lg:table-cell">Device</TableHead>
                                    <TableHead className="text-right">Map</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statsData.recentLogs.length > 0 ? (
                                    statsData.recentLogs.map((log, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                                            <TableCell className="text-sm">
                                                <div className="font-medium truncate max-w-xs">{log.address}</div>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    {log.coordinates} (acc: {log.accuracy})
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground truncate max-w-sm">{log.device}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={log.mapLink} target="_blank" rel="noopener noreferrer">
                                                        <LinkIcon className="h-3 w-3 mr-1" />
                                                        View
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No activity logged yet.
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
