
"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Database, 
  Folder, 
  FileText, 
  ChevronRight, 
  Search,
  Download,
  Trash2,
  ExternalLink
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

const MOCK_FOLDERS = [
  { date: "2023-10-27", count: 421, size: "1.2 MB" },
  { date: "2023-10-26", count: 854, size: "2.4 MB" },
  { date: "2023-10-25", count: 120, size: "0.5 MB" },
  { date: "2023-10-24", count: 2133, size: "8.1 MB" },
]

const MOCK_FILES = [
  { hash: "d41d8cd98f00b204e9800998ecf8427e", length: "1.2kb", time: "14:22:10" },
  { hash: "84729426f00b204e9800998ecf8427e", length: "0.4kb", time: "14:21:45" },
  { hash: "11239cd98f00b204e9800998ecf8427e", length: "5.1kb", time: "14:19:02" },
  { hash: "f9283cd98f00b204e9800998ecf8427e", length: "2.8kb", time: "14:15:33" },
]

export default function DataBrowserPage() {
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Data Browser</h1>
        </header>

        <div className="flex flex-1 gap-0 h-[calc(100vh-64px)] overflow-hidden">
          {/* Left Panel: Folders */}
          <div className="w-80 border-r border-border bg-muted/20 flex flex-col">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Filter by date..." 
                  className="pl-9 h-9" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {MOCK_FOLDERS.filter(f => f.date.includes(search)).map((folder) => (
                  <button
                    key={folder.date}
                    onClick={() => setSelectedFolder(folder.date)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedFolder === folder.date 
                        ? "bg-primary text-primary-foreground shadow-md" 
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <Folder className={`h-4 w-4 ${selectedFolder === folder.date ? "text-white" : "text-muted-foreground"}`} />
                    <span className="flex-1 text-left font-medium">{folder.date}</span>
                    <span className={`text-[10px] ${selectedFolder === folder.date ? "text-white/70" : "text-muted-foreground"}`}>
                      {folder.count} files
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Files */}
          <div className="flex-1 flex flex-col">
            {selectedFolder ? (
              <>
                <div className="p-4 border-b bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Database className="h-4 w-4" />
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-semibold">{selectedFolder}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" /> Export All
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" /> Purge Folder
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader className="bg-muted/30 sticky top-0 z-10">
                      <TableRow>
                        <TableHead>Filename (MD5 Hash)</TableHead>
                        <TableHead className="w-24">Size</TableHead>
                        <TableHead className="w-32">Scraped At</TableHead>
                        <TableHead className="w-20 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_FILES.map((file) => (
                        <TableRow key={file.hash} className="hover:bg-muted/50 cursor-pointer">
                          <TableCell className="font-code flex items-center gap-2">
                            <FileText className="h-4 w-4 text-accent" />
                            {file.hash}.txt
                          </TableCell>
                          <TableCell className="text-muted-foreground">{file.length}</TableCell>
                          <TableCell className="text-muted-foreground">{file.time}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-accent">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Database className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">No Folder Selected</h2>
                <p className="max-w-xs mt-2">Choose a date folder from the sidebar to view scraped documents and their metadata.</p>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
