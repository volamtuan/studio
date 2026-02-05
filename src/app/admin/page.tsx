"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, RefreshCw, Download, Trash2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { getLogContentAction, deleteLogsAction } from "@/app/actions/logs"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const [logContent, setLogContent] = React.useState("Loading logs...")
  const [loading, setLoading] = React.useState(true)
  const { toast } = useToast()

  const fetchLogs = React.useCallback(async () => {
    setLoading(true)
    const content = await getLogContentAction()
    setLogContent(content)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleDownload = () => {
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' })
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
    if (window.confirm("Are you sure you want to delete all access logs? This action cannot be undone.")) {
      setLoading(true)
      const result = await deleteLogsAction()
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        await fetchLogs()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        })
      }
      setLoading(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Access Logs</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading || !logContent}>
              <Download className="h-4 w-4" />
               <span className="ml-2 hidden sm:inline">Download</span>
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
              <Trash2 className="h-4 w-4" />
               <span className="ml-2 hidden sm:inline">Clear Logs</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  logs/tracking_logs.txt
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[65vh] rounded-md border bg-muted/20 p-4 font-code">
                <pre className="text-sm text-foreground whitespace-pre-wrap">
                  {loading ? "Loading logs..." : logContent}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
