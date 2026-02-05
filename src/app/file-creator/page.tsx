
"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getIpLinksAction, type IpLinkConfig } from "@/app/actions/ip-links"
import { FilePlus2, UploadCloud, Download, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import PizZip from "pizzip"
import { saveAs } from "file-saver"

export default function FileCreatorPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [ipLinks, setIpLinks] = React.useState<IpLinkConfig[]>([])
  const [selectedLink, setSelectedLink] = React.useState<string>("")
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [origin, setOrigin] = React.useState("")

  React.useEffect(() => {
    // Permission check
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (!user.permissions?.includes('admin') && !user.permissions?.includes('file_creator')) {
        toast({ title: 'Truy cập bị từ chối', description: 'Bạn không có quyền truy cập trang này.', variant: 'destructive' });
        router.replace('/dashboard');
      }
    } catch (e) {
      router.replace('/login');
    }
    
    // Get window origin
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }

    // Fetch IP links
    async function loadIpLinks() {
      const links = await getIpLinksAction()
      setIpLinks(links)
    }
    loadIpLinks()
  }, [router, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.type !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        toast({
          variant: "destructive",
          title: "Loại tệp không hợp lệ",
          description: "Vui lòng chỉ tải lên tệp .docx."
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleGenerate = () => {
    if (!selectedFile || !selectedLink) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng tải lên tệp .docx và chọn một liên kết theo dõi."
      })
      return
    }

    setIsLoading(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result
        const zip = new PizZip(content as ArrayBuffer)
        const relsPath = 'word/_rels/document.xml.rels'
        const relsFile = zip.file(relsPath)
        
        if (!relsFile) {
          throw new Error("Không tìm thấy tệp 'word/_rels/document.xml.rels'. Tệp DOCX có thể bị hỏng hoặc không hợp lệ.")
        }
        
        let relsContent = relsFile.asText()
        
        const trackingUrl = `${origin}/l/${selectedLink}`
        const relationshipId = `rId${Date.now()}`
        const newRel = `<Relationship Id="${relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/attachedTemplate" Target="${trackingUrl}" TargetMode="External"/>`

        if (relsContent.includes('</Relationships>')) {
          relsContent = relsContent.replace('</Relationships>', `${newRel}</Relationships>`)
        } else {
          throw new Error("Cấu trúc tệp .rels không hợp lệ.")
        }
        
        zip.file(relsPath, relsContent)

        const out = zip.generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        })

        const outputFilename = `tracked_${selectedFile.name}`
        saveAs(out, outputFilename)

        toast({
          title: "Thành công!",
          description: `Tệp ${outputFilename} đã được tạo và tải xuống.`
        })

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Đã xảy ra lỗi",
          description: error.message || "Không thể xử lý tệp DOCX."
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể đọc tệp đã tải lên."
      })
      setIsLoading(false)
    }

    reader.readAsArrayBuffer(selectedFile)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Tạo File DOCX Theo Dõi</h1>
        </header>
        <main className="flex-1 p-6 flex justify-center">
          <div className="w-full max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FilePlus2 />
                  Chèn Link Theo Dõi vào File DOCX
                </CardTitle>
                <CardDescription>
                  Tải lên một tệp .docx và chọn một "Link Lấy IP" để chèn vào. Hệ thống sẽ tự động tạo và tải xuống một tệp mới chứa link theo dõi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ip-link-select">1. Chọn Link Theo Dõi</Label>
                  <Select value={selectedLink} onValueChange={setSelectedLink}>
                    <SelectTrigger id="ip-link-select">
                      <SelectValue placeholder="Chọn một link đã tạo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ipLinks.length > 0 ? ipLinks.map(link => (
                        <SelectItem key={link.id} value={link.id}>
                          {link.title} ({origin}/l/{link.id})
                        </SelectItem>
                      )) : (
                        <SelectItem value="none" disabled>Không có link nào. Vui lòng tạo ở trang 'Tạo Link Lấy IP'.</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>2. Tải Lên Tệp DOCX Gốc</Label>
                  <Label htmlFor="file-upload" className="relative block w-full border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <UploadCloud className="h-8 w-8" />
                      {selectedFile ? (
                        <span className="font-semibold text-primary">{selectedFile.name}</span>
                      ) : (
                        <span>Nhấn để chọn tệp .docx</span>
                      )}
                    </div>
                  </Label>
                  <Input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                </div>
                <Button className="w-full" onClick={handleGenerate} disabled={isLoading || !selectedFile || !selectedLink}>
                  {isLoading ? "Đang xử lý..." : <><Download className="mr-2 h-4 w-4" /> Tạo và Tải Xuống</>}
                </Button>
              </CardContent>
            </Card>

            <div className="bg-amber-500/10 border-l-4 border-amber-500 text-amber-800 p-4 rounded-md" role="alert">
                <div className="flex">
                    <div className="py-1"><AlertCircle className="h-5 w-5 text-amber-500 mr-3" /></div>
                    <div>
                        <p className="font-bold">Lưu ý quan trọng</p>
                        <p className="text-sm">
                            Kỹ thuật này hoạt động bằng cách chèn một "template" từ xa. Khi người dùng mở file Word, ứng dụng sẽ cố gắng tải template đó, qua đó gửi một yêu cầu đến link theo dõi của bạn. <br/>
                            <strong>Tuy nhiên, Microsoft Word thường sẽ hiển thị một cảnh báo bảo mật.</strong> Hiệu quả phụ thuộc vào việc người dùng có đồng ý bỏ qua cảnh báo hay không.
                        </p>
                    </div>
                </div>
            </div>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
