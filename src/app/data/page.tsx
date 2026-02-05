
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
  ExternalLink,
  RefreshCw,
  X
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
import { 
  getFoldersAction, 
  getFilesAction, 
  getFileContentAction, 
  purgeFolderAction 
} from "@/app/actions/scraper"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function DataBrowserPage() {
  const [folders, setFolders] = React.useState<any[]>([])
  const [files, setFiles] = React.useState<any[]>([])
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [viewingFile, setViewingFile] = React.useState<{hash: string, content: string} | null>(null)
  const { toast } = useToast()

  const fetchFolders = async () => {
    const res = await getFoldersAction()
    setFolders(res)
  }

  const fetchFiles = async (folder: string) => {
    setLoading(true)
    const res = await getFilesAction(folder)
    setFiles(res)
    setLoading(false)
  }

  React.useEffect(() => {
    fetchFolders()
  }, [])

  const handleFolderClick = (date: string) => {
    setSelectedFolder(date)
    fetchFiles(date)
  }

  const handlePurge = async (folder: string) => {
    if (confirm(`Are you sure you want to delete all data in ${folder}?`)) {
      await purgeFolderAction(folder)
      setSelectedFolder(null)
      setFiles([])
      fetchFolders()
      toast({ title: "Folder Purged", description: `Deleted data for ${folder}` })
    }
  }

  const handleViewFile = async (folder: string, hash: string) => {
    const content = await getFileContentAction(folder, `${hash}.txt`)
    setViewingFile({ hash, content })
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Data Browser</h1>
          <Button variant="ghost" size="icon" className="ml-auto" onClick={fetchFolders}>
            <RefreshCw className="h-4 w-4" />
          </Button>
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
                {folders.filter(f => f.date.includes(search)).map((folder) => (
                  <button
                    key={folder.date}
                    onClick={() => handleFolderClick(folder.date)}
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
                {folders.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-xs italic">No data folders found.</div>
                )}
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
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handlePurge(selectedFolder)}>
                      <Trash2 className="h-4 w-4 text-destructive" /> Purge Folder
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
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
                        {files.map((file) => (
                          <TableRow 
                            key={file.hash} 
                            className="hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleViewFile(selectedFolder, file.hash)}
                          >
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
                        {files.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">No files in this folder.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
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

        <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-code text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                {viewingFile?.hash}.txt
              </DialogTitle>
              <DialogDescription>Full document content</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 bg-black rounded-lg border p-4 font-code text-sm text-green-400 selection:bg-green-400/20">
              <pre className="whitespace-pre-wrap">{viewingFile?.content}</pre>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
