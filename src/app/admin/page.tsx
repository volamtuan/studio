
import { promises as fs } from 'fs';
import path from 'path';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

async function getLogContent() {
  const logFile = path.join(process.cwd(), 'logs', 'tracking_logs.txt');
  try {
    const content = await fs.readFile(logFile, 'utf-8');
    return content;
  } catch (error) {
    return "Could not read log file. It may not exist yet.";
  }
}

export default async function AdminPage() {
  const logContent = await getLogContent();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Access Logs</h1>
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
                  {logContent}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
