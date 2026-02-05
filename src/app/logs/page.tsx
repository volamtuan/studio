
"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Terminal, Download, Trash2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function LogsPage() {
  const [logs, setLogs] = React.useState<string[]>([])

  React.useEffect(() => {
    // Generate some initial logs
    const initialLogs = Array.from({ length: 100 }, (_, i) => {
      const time = new Date(Date.now() - (100 - i) * 60000).toLocaleTimeString()
      return `[${time}] System operational - Thread pool at 100% capacity.`
    })
    setLogs(initialLogs)
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">System Logs</h1>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/20">
              <Trash2 className="h-4 w-4" /> Clear
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
              {logs.map((log, i) => (
                <div key={i} className="mb-1 group flex">
                  <span className="text-muted-foreground mr-4 w-24 shrink-0 selection:bg-transparent">
                    {new Date().toLocaleDateString()}
                  </span>
                  <span className="hover:text-green-400">{log}</span>
                </div>
              ))}
              <div className="mt-4 animate-pulse">_</div>
            </ScrollArea>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
