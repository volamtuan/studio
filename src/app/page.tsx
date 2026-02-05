
"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Square, 
  Activity, 
  Hash, 
  Save, 
  AlertCircle,
  Terminal as TerminalIcon
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function DashboardPage() {
  const [isRunning, setIsRunning] = React.useState(false)
  const [logs, setLogs] = React.useState<string[]>([
    "System initialized. Ready to start.",
    "Loading used IDs log...",
    "Found 1,245 unique IDs in local cache.",
  ])

  const toggleCrawler = () => {
    setIsRunning(!isRunning)
    const newLog = !isRunning 
      ? `[${new Date().toLocaleTimeString()}] Crawler started with 100 threads.`
      : `[${new Date().toLocaleTimeString()}] Stop signal received. Cleaning up worker queue...`
    setLogs(prev => [...prev, newLog])
  }

  // Simulate logs
  React.useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        const timestamp = new Date().toLocaleTimeString()
        const actions = [
          `[+] Saved: /data/2023-10-27/${Math.random().toString(36).substring(7)}.txt`,
          `[-] Checked ID: ${Math.random().toString(36).substring(7)} - Empty`,
          `[!] Proxy error on thread 12 - Retrying...`,
          `[+] New content found: 2.4kb length`,
        ]
        setLogs(prev => [...prev.slice(-49), `[${timestamp}] ${actions[Math.floor(Math.random() * actions.length)]}`])
      }, 1500)
      return () => clearInterval(interval)
    }
  }, [isRunning])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Crawler Control Center</h1>
          <div className="ml-auto flex items-center gap-4">
            <Badge variant={isRunning ? "default" : "secondary"} className={isRunning ? "bg-green-600 animate-pulse" : ""}>
              {isRunning ? "Running" : "Idle"}
            </Badge>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card border-border shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scanned IDs</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">128,432</div>
                <p className="text-xs text-muted-foreground">+2,341 in the last hour</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saved Documents</CardTitle>
                <Save className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4,122</div>
                <p className="text-xs text-muted-foreground">Unique content found</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Threads</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isRunning ? "100" : "0"}</div>
                <p className="text-xs text-muted-foreground">Parallel worker load</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.4%</div>
                <p className="text-xs text-muted-foreground">Connection timeouts</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-4 bg-card border-border shadow-xl overflow-hidden flex flex-col">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <TerminalIcon className="h-5 w-5 text-primary" />
                      Live System Logs
                    </CardTitle>
                    <CardDescription>Real-time crawler activities and status updates</CardDescription>
                  </div>
                  <Button 
                    variant={isRunning ? "destructive" : "default"} 
                    className="gap-2 font-bold shadow-lg"
                    onClick={toggleCrawler}
                  >
                    {isRunning ? (
                      <><Square className="h-4 w-4" /> Stop Scraper</>
                    ) : (
                      <><Play className="h-4 w-4" /> Start Scraper</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ScrollArea className="h-[400px] w-full p-4 font-code text-sm">
                  {logs.map((log, i) => (
                    <div key={i} className="mb-1">
                      <span className="text-muted-foreground">[{i}]</span> {log}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="md:col-span-3 bg-card border-border shadow-xl">
              <CardHeader>
                <CardTitle>Configuration Quick-Look</CardTitle>
                <CardDescription>Current scraping parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Target URL</span>
                  <span className="font-medium">notepad.vn/*</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Proxy Mode</span>
                  <Badge variant="outline" className="text-accent border-accent/50">Rotation ON</Badge>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Minimum Length</span>
                  <span className="font-medium">5 characters</span>
                </div>
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Worker Count</span>
                  <span className="font-medium">100 Threads</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-muted-foreground">Storage Engine</span>
                  <span className="font-medium">Local /data/ directory</span>
                </div>
                
                <div className="pt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/proxies">Manage Proxies & Settings</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
