
"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProxiesPage() {
  const [useProxy, setUseProxy] = React.useState(true)
  const [proxyList, setProxyList] = React.useState("")
  const { toast } = useToast()

  const handleSave = () => {
    toast({
      title: "Proxies updated",
      description: `Successfully loaded ${proxyList.split("\n").filter(l => l.trim()).length} proxy servers.`
    })
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Proxy Management</h1>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
          <Card className="bg-card border-border shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-accent" />
                    Global Proxy Settings
                  </CardTitle>
                  <CardDescription>Configure how the crawler accesses notepad.vn</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="proxy-toggle">Enable Proxy</Label>
                  <Switch 
                    id="proxy-toggle" 
                    checked={useProxy} 
                    onCheckedChange={setUseProxy} 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="proxies">Proxy List (One per line)</Label>
                <Textarea 
                  id="proxies" 
                  placeholder="ip:port:user:pass" 
                  className="min-h-[300px] font-code bg-muted/50 border-border focus:ring-accent"
                  value={proxyList}
                  onChange={(e) => setProxyList(e.target.value)}
                  disabled={!useProxy}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Format: ip:port or ip:port:username:password
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline">Reset to Default</Button>
                <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleSave}>
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 border-dashed">
            <CardHeader className="py-4">
              <CardTitle className="text-base">Why use proxies?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              Notepad.vn employs rate-limiting to prevent excessive automated requests. Using a large pool of high-quality proxy servers allows the scraper to run at higher thread counts (100+) without triggering IP blocks or captchas. We recommend rotating residential proxies for the best results.
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
