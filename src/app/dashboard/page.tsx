
import { promises as fs } from 'fs';
import path from 'path';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Users, MapPin } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const logFile = path.join(process.cwd(), 'logs', 'tracking_logs.txt');

interface RecentLog {
  timestamp: string;
  ip: string;
  device: string;
  location: string;
}

async function getLogStats() {
  try {
    const content = await fs.readFile(logFile, 'utf-8');
    const entries = content.split('--- [').filter(e => e.trim() !== '');

    const uniqueIps = new Set<string>();
    entries.forEach(entry => {
        const ipMatch = entry.match(/IP: (.*?)\n/);
        if (ipMatch && ipMatch[1]) {
            uniqueIps.add(ipMatch[1]);
        }
    });

    const locationsLogged = entries.filter(e => /Tọa độ:/.test(e)).length;
    
    const recentLogs: RecentLog[] = entries.slice(-10).reverse().map(entry => {
      const lines = entry.split('\n');
      const timestamp = lines[0]?.split(']')[0] || 'N/A';
      
      const ipMatch = entry.match(/IP: (.*?)\n/);
      const ip = ipMatch ? ipMatch[1] : 'N/A';

      const deviceMatch = entry.match(/Thiết bị: (.*?)\n/);
      const device = deviceMatch ? deviceMatch[1] : 'N/A';

      const locationMatch = entry.match(/Vị trí \(ước tính\): (.*?)\n/);
      const location = locationMatch ? locationMatch[1] : 'N/A';
      
      return { timestamp, ip, device, location };
    });

    return {
      totalVisits: entries.length,
      locationsLogged,
      uniqueIps: uniqueIps.size,
      recentLogs
    };

  } catch (error) {
    // If file does not exist or other error
    return {
      totalVisits: 0,
      locationsLogged: 0,
      uniqueIps: 0,
      recentLogs: []
    };
  }
}


export default async function DashboardPage() {
  const statsData = await getLogStats();

  const statsCards = [
      { title: "Total Visits", value: statsData.totalVisits.toLocaleString(), icon: Users },
      { title: "Locations Logged", value: statsData.locationsLogged.toLocaleString(), icon: MapPin },
      { title: "Unique IPs", value: statsData.uniqueIps.toLocaleString(), icon: BarChart }
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                        <CardDescription>Showing the last 10 visits to the verification page.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px]">Timestamp</TableHead>
                                    <TableHead className="w-[150px]">IP Address</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead className="hidden md:table-cell">Device</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {statsData.recentLogs.length > 0 ? (
                                    statsData.recentLogs.map((log, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                                            <TableCell className="font-medium">{log.ip}</TableCell>
                                            <TableCell>{log.location}</TableCell>
                                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground truncate max-w-xs">{log.device}</TableCell>
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
