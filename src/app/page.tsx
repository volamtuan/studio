
"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Play, 
  Square, 
  Activity, 
  Hash, 
  Save, 
  AlertCircle,
  Terminal as TerminalIcon,
  Settings2
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { startScraperAction, stopScraperAction, getScraperStatusAction } from "@/app/actions/scraper"

export default function DashboardPage() {
  const [status, setStatus] = React.useState({
    isRunning: false,
    threads: 0,
    logs: [] as string[],
    scannedCount: 0,
    savedCount: 0,
    errorRate: 0
  })
  const [threadInput, setThreadInput] = React.useState(50)

  const fetchStatus = async () => {
    const res = await getScraperStatusAction()
    setStatus(res)
  }

  React.useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [])

  const toggleCrawler = async () => {
    if (status.isRunning) {
      await stopScraperAction()
    } else {
      await startScraperAction(threadInput)
    }
    fetchStatus()
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Crawler Control Center</h1>
          <div className="ml-auto flex items-center gap-4">
            <Badge variant={status.isRunning ? "default" : "secondary"} className={status.isRunning ? "bg-green-600 animate-pulse" : ""}>
              {status.isRunning ? "Running" : "Idle"}
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
                <div className="text-2xl font-bold">{status.scannedCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total IDs checked in session</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saved Documents</CardTitle>
                <Save className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.savedCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Unique content found</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.threads}</div>
                <p className="text-xs text-muted-foreground">Parallel scraper load</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.errorRate.toFixed(1)}%</div>
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
                    variant={status.isRunning ? "destructive" : "default"} 
                    className="gap-2 font-bold shadow-lg"
                    onClick={toggleCrawler}
                  >
                    {status.isRunning ? (
                      <><Square className="h-4 w-4" /> Stop Scraper</>
                    ) : (
                      <><Play className="h-4 w-4" /> Start Scraper</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ScrollArea className="h-[400px] w-full p-4 font-code text-sm">
                  {status.logs.length > 0 ? (
                    status.logs.map((log, i) => (
                      <div key={i} className="mb-1">
                        <span className="text-muted-foreground">[{status.logs.length - i}]</span> {log}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground text-center py-20 italic">No logs generated yet...</div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="md:col-span-3 bg-card border-border shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-accent" />
                  <CardTitle>Configuration</CardTitle>
                </div>
                <CardDescription>Adjust scraper intensity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="threads">Parallel Worker Count</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="threads" 
                      type="number" 
                      value={threadInput} 
                      onChange={(e) => setThreadInput(parseInt(e.target.value) || 1)}
                      min={1} 
                      max={500}
                      className="bg-muted/30"
                      disabled={status.isRunning}
                    />
                    <Button variant="outline" onClick={() => setThreadInput(50)} disabled={status.isRunning}>Reset</Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Recommended: 20-100 threads</p>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Target URL</span>
                    <span className="font-medium">notepad.vn/*</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-muted-foreground">Storage Engine</span>
                    <span className="font-medium">Local ./data/</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/data">Browse Scraped Data</a>
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
