'use client';

import * as React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Link as LinkIcon, Globe, Image as ImageIcon, MapPin, Clock, ExternalLink, Eye, Package } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { getLogStatsAction, type LogStats } from '../actions/logs';
import { MapPreviewPopup } from '@/components/map-preview-popup';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUserAction, logoutAction, type SessionPayload } from '@/app/actions/users';

export default function DashboardPage() {
  const [statsData, setStatsData] = React.useState<LogStats>({ totalVisits: 0, uniqueIps: 0, recentLogs: [], visitsInLast5Mins: 0 });
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<SessionPayload | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchStats = React.useCallback(async () => {
    const stats = await getLogStatsAction();
    setStatsData(stats);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    
    async function checkAuthAndFetch() {
        const currentUser = await getCurrentUserAction();
        setUser(currentUser);
        if (!currentUser || currentUser.permissions.length === 0) {
            toast({ title: 'Truy cập bị từ chối', description: 'Tài khoản không có quyền. Vui lòng liên hệ quản trị viên.', variant: 'destructive' });
            await logoutAction();
            router.replace('/login');
        } else {
            fetchStats();
            interval = setInterval(fetchStats, 5000); // Auto-refresh every 5 seconds
        }
    }

    checkAuthAndFetch();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchStats, router, toast]);

  const hasLogsPermission = React.useMemo(() => {
    if (!user) return false;
    return user.permissions.includes('admin') || user.permissions.includes('access_logs');
  }, [user]);

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
            
            {hasLogsPermission && (
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
                                      statsData.recentLogs.map((log, index) => {
                                          const coords = log.coordinates.split(', ');
                                          const lat = coords.length > 1 ? coords[0] : null;
                                          const lon = coords.length > 1 ? coords[1] : null;

                                          return (
                                          <TableRow key={index}>
                                              <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                                              <TableCell className="font-mono text-xs">
                                                  <div className="flex items-center gap-2">
                                                      <span>{log.ip}</span>
                                                      {log.source === 'image' && <Badge variant="secondary" className="gap-1"><ImageIcon className="h-3 w-3" />Ảnh</Badge>}
                                                      {log.source === 'link' && <Badge variant="outline" className="gap-1"><LinkIcon className="h-3 w-3"/>Link</Badge>}
                                                      {log.source === 'cloaker' && <Badge variant="default" className="gap-1"><Package className="h-3 w-3"/>Bọc</Badge>}
                                                      {log.source === 'pixel_tracker' && <Badge variant="destructive" className="gap-1"><Eye className="h-3 w-3"/>Logger</Badge>}
                                                      {log.source === 'ip_link' && <Badge variant="outline" className="gap-1"><Globe className="h-3 w-3"/>IP Link</Badge>}
                                                  </div>
                                                  {log.isp && log.isp !== 'N/A' && (
                                                      <div className="text-muted-foreground/80 truncate max-w-[250px]" title={log.isp}>
                                                          {log.isp}
                                                      </div>
                                                  )}
                                                  {log.ipType && log.ipType !== 'N/A' && (
                                                      <div className="text-amber-600 dark:text-amber-500 text-xs font-semibold" title={log.ipType}>
                                                          {log.ipType}
                                                      </div>
                                                  )}
                                              </TableCell>
                                              <TableCell className="text-sm">
                                                  <div className="font-medium truncate max-w-xs">{log.address}</div>
                                                  {log.redirectUrl && log.redirectUrl !== 'N/A' ? (
                                                      <a
                                                          href={log.redirectUrl}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          title="Truy cập link chuyển hướng"
                                                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                                      >
                                                          <ExternalLink className="h-3 w-3" />
                                                          <span className="truncate">Chuyển hướng: {log.redirectUrl}</span>
                                                      </a>
                                                  ) : log.mapLink !== 'N/A' ? (
                                                      <div className="flex items-center gap-2">
                                                          {lat && lon ? (
                                                              <MapPreviewPopup
                                                                  lat={lat}
                                                                  lon={lon}
                                                                  address={log.address}
                                                                  trigger={
                                                                      <button className="text-xs text-muted-foreground font-mono cursor-pointer hover:text-primary flex items-center gap-1 w-fit text-left">
                                                                          <MapPin className="h-3 w-3" />
                                                                          <span>{log.coordinates} (acc: {log.accuracy})</span>
                                                                      </button>
                                                                  }
                                                              />
                                                          ) : (
                                                              <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                                                  <MapPin className="h-3 w-3" />
                                                                  <span>{log.coordinates}</span>
                                                              </div>
                                                          )}
                                                          <a
                                                            href={log.mapLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Mở trong tab mới"
                                                            className="text-muted-foreground hover:text-primary"
                                                          >
                                                              <ExternalLink className="h-3.5 w-3.5" />
                                                          </a>
                                                      </div>
                                                  ) : (
                                                      <div className="text-xs text-muted-foreground italic">Không có dữ liệu vị trí</div>
                                                  )}
                                              </TableCell>
                                              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground truncate max-w-sm">
                                                <div className="truncate">{log.device}</div>
                                                {(log.language !== 'N/A' || log.timezone !== 'N/A') && (
                                                  <div className="text-muted-foreground/80 truncate" title={`${log.language} (${log.timezone})`}>
                                                      {log.language} ({log.timezone})
                                                  </div>
                                                )}
                                              </TableCell>
                                          </TableRow>
                                      )})
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
            )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
