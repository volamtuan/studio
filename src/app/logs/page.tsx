
"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Terminal, Download, Trash2, Filter, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getScraperStatusAction } from "@/app/actions/scraper"

export default function LogsPage() {
  const [logs, setLogs] = React.useState<string[]>([])
  const [autoRefresh, setAutoRefresh] = React.useState(true)

  const fetchLogs = async () => {
    const status = await getScraperStatusAction()
    // Reversing logs back for logical reading in console view
    setLogs([...status.logs].reverse())
  }

  React.useEffect(() => {
    fetchLogs()
    let interval: any
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 2000)
    }
    return () => clearInterval(interval)
  }, [autoRefresh])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">System Logs</h1>
          <div className="ml-auto flex gap-2">
            <Button 
              variant={autoRefresh ? "secondary" : "outline"} 
              size="sm" 
              className="gap-2"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} /> 
              {autoRefresh ? "Auto-refreshing" : "Static"}
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/20">
              <Trash2 className="h-4 w-4" /> Clear Console
            </Button>
          </div>
        </header>

        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex-1 bg-black rounded-xl border border-border shadow-inner overflow-hidden flex flex-col">
            <div className="bg-muted/10 border-b p-3 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              <span className="text-xs font-code font-semibold tracking-wider uppercase text-muted-foreground">Console Output (stdout)</span>
            </div>
            <ScrollArea className="flex-1 p-6 font-code text-sm text-green-500/90 leading-relaxed">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="mb-1 group flex">
                    <span className="text-muted-foreground mr-4 w-24 shrink-0 selection:bg-transparent">
                      LOG_{i.toString().padStart(3, '0')}
                    </span>
                    <span className="hover:text-green-400">{log}</span>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground italic">Initializing console...</div>
              )}
              <div className="mt-4 animate-pulse">_</div>
            </ScrollArea>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
