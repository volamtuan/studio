
"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Button } from "@/components/ui/button"
import { 
  Database, 
  Folder, 
  FileText, 
  ChevronRight, 
  Search,
  Trash2,
  RefreshCw,
  X,
  FileCode,
  ArrowLeft
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
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { getCurrentUserAction } from "@/app/actions/users"

export default function DataBrowserPage() {
  const [folders, setFolders] = React.useState<any[]>([])
  const [files, setFiles] = React.useState<any[]>([])
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<{hash: string, content: string} | null>(null)
  const [search, setSearch] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [contentLoading, setContentLoading] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

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
    setSelectedFile(null)
    fetchFiles(date)
  }

  const handlePurge = async (folder: string) => {
    if (confirm(`Are you sure you want to delete all data in ${folder}?`)) {
      await purgeFolderAction(folder)
      setSelectedFolder(null)
      setSelectedFile(null)
      setFiles([])
      fetchFolders()
      toast({ title: "Folder Purged", description: `Deleted data for ${folder}` })
    }
  }

  const handleViewFile = async (folder: string, hash: string) => {
    if (selectedFile?.hash === hash) return
    setContentLoading(true)
    const content = await getFileContentAction(folder, `${hash}.txt`)
    setSelectedFile({ hash, content })
    setContentLoading(false)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Data Browser</h1>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="icon" onClick={fetchFolders}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
          {/* Pane 1: Folders */}
          <div className="w-64 border-r border-border bg-muted/10 flex flex-col shrink-0">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                <Input 
                  placeholder="Filter..." 
                  className="pl-7 h-8 text-xs" 
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
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors ${
                      selectedFolder === folder.date 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <Folder className={`h-3.5 w-3.5 ${selectedFolder === folder.date ? "text-white" : "text-muted-foreground"}`} />
                    <span className="flex-1 text-left font-medium truncate">{folder.date}</span>
                    <Badge variant="outline" className={`px-1 h-4 text-[9px] ${selectedFolder === folder.date ? "bg-white/20 border-white/40 text-white" : ""}`}>
                      {folder.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Pane 2: Files */}
          <div className={`flex-1 flex flex-col border-r border-border min-w-0 ${selectedFile ? 'hidden lg:flex' : 'flex'}`}>
            {selectedFolder ? (
              <>
                <div className="p-3 border-b bg-card flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                    <Database className="h-3 w-3" />
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground">{selectedFolder}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handlePurge(selectedFolder)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Purge
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="flex items-center justify-center h-40">
                      <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-muted/30 sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="h-9 text-xs">File (MD5 Hash)</TableHead>
                          <TableHead className="h-9 text-xs w-20">Size</TableHead>
                          <TableHead className="h-9 text-xs w-24">Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {files.map((file) => (
                          <TableRow 
                            key={file.hash} 
                            className={`cursor-pointer transition-colors ${selectedFile?.hash === file.hash ? "bg-accent/20" : "hover:bg-muted/50"}`}
                            onClick={() => handleViewFile(selectedFolder, file.hash)}
                          >
                            <TableCell className="py-2 text-xs font-code flex items-center gap-2">
                              <FileText className={`h-3.5 w-3.5 ${selectedFile?.hash === file.hash ? "text-accent" : "text-muted-foreground"}`} />
                              <span className="truncate max-w-[120px] sm:max-w-none">{file.hash}</span>
                            </TableCell>
                            <TableCell className="py-2 text-[10px] text-muted-foreground">{file.length}</TableCell>
                            <TableCell className="py-2 text-[10px] text-muted-foreground">{file.time}</TableCell>
                          </TableRow>
                        ))}
                        {files.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-20 text-muted-foreground text-xs italic">No documents found.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <Database className="h-10 w-10 text-muted-foreground/30 mb-4" />
                <p className="text-sm">Select a date to browse documents</p>
              </div>
            )}
          </div>

          {/* Pane 3: Content Preview */}
          <div className={`flex-1 flex flex-col bg-card/50 ${selectedFile ? 'flex' : 'hidden lg:flex'}`}>
            {selectedFile ? (
              <>
                <div className="p-3 border-b bg-card flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs overflow-hidden">
                    <Button variant="ghost" size="icon" className="h-7 w-7 lg:hidden" onClick={() => setSelectedFile(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <FileCode className="h-3 w-3 text-accent shrink-0" />
                    <span className="text-foreground font-code truncate">{selectedFile.hash}.txt</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 relative overflow-hidden">
                  {contentLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : null}
                  <ScrollArea className="h-full">
                    <div className="p-6 font-code text-sm text-green-400 selection:bg-green-400/20 whitespace-pre-wrap leading-relaxed">
                      {selectedFile.content}
                    </div>
                  </ScrollArea>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <FileText className="h-10 w-10 text-muted-foreground/30 mb-4" />
                <p className="text-sm">Click a file to view its content directly</p>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
