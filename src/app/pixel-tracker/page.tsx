"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { getPixelLinksAction, savePixelLinksAction, type PixelLinkConfig } from "@/app/actions/pixel-links"
import { uploadFileAction } from "@/app/actions/upload"
import { Copy, PlusCircle, Save, Trash2, Eye, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { getCurrentUserAction } from "@/app/actions/users"
import Image from "next/image"

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc."),
  // imageUrl is handled by file upload
})

export default function PixelTrackerPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [links, setLinks] = React.useState<PixelLinkConfig[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [adding, setAdding] = React.useState(false)
  const [origin, setOrigin] = React.useState("")

  // State for file upload
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function checkAuth() {
        const user = await getCurrentUserAction();
        if (!user || (!user.permissions.includes('admin') && !user.permissions.includes('pixel_tracker'))) {
            toast({ title: 'Truy cập bị từ chối', description: 'Bạn không có quyền truy cập trang này.', variant: 'destructive' });
            router.replace('/dashboard');
        }
    }
    checkAuth();
  }, [router, toast]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }

    async function loadLinks() {
      setLoading(true)
      const existingLinks = await getPixelLinksAction()
      setLinks(existingLinks)
      setLoading(false)
    }
    loadLinks()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "Logger mới",
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    } else {
        setImageFile(null);
        setPreviewUrl(null);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!imageFile) {
        toast({
            variant: "destructive",
            title: "Thiếu hình ảnh",
            description: "Vui lòng chọn một tệp hình ảnh để tải lên. Đối với pixel 1x1, bạn có thể tạo một ảnh PNG trong suốt.",
        });
        return;
    }
    setAdding(true);

    const formData = new FormData();
    formData.append('file', imageFile);
    const uploadResult = await uploadFileAction(formData);

    if (!uploadResult.success) {
        toast({
            variant: "destructive",
            title: "Lỗi tải lên",
            description: uploadResult.message,
        });
        setAdding(false);
        return;
    }

    const newLink: PixelLinkConfig = {
      id: crypto.randomUUID(),
      title: values.title,
      imageUrl: uploadResult.url
    }
    setLinks(prevLinks => [...prevLinks, newLink])
    toast({
      title: "Đã thêm IP Logger mới",
      description: "Đừng quên nhấn 'Lưu thay đổi' để áp dụng.",
    })
    
    form.reset({ title: "Logger mới" });
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    setImageFile(null);
    setPreviewUrl(null);
    setAdding(false);
  }

  const handleDelete = (id: string) => {
    setLinks(prevLinks => prevLinks.filter(link => link.id !== id))
    toast({
        title: "Đã xóa logger",
        description: "Thay đổi sẽ được áp dụng sau khi bạn lưu.",
        variant: "destructive"
    })
  }
  
  const handleCopy = (id: string) => {
    const url = `${origin}/api/pixel/${id}.png`
    navigator.clipboard.writeText(url)
    toast({
      title: "Đã sao chép!",
      description: "URL IP Logger đã được sao chép vào bộ nhớ tạm.",
    })
  }
  
  const handleSave = async () => {
    setSaving(true);
    const result = await savePixelLinksAction(links);
    if (result.success) {
      toast({
        title: "Thành công",
        description: "Các IP logger đã được lưu thành công.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: result.message,
      });
    }
    setSaving(false);
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Tạo IP Logger</h1>
        </header>
        <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardHeader>
                    <CardTitle>Tạo IP Logger Mới</CardTitle>
                    <CardDescription>
                      Tạo một URL hình ảnh để ghi lại IP của người xem. Hữu ích để chèn vào email, diễn đàn, hoặc website.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên gợi nhớ</FormLabel>
                        <FormControl>
                          <Input placeholder="Vd: Logger cho email marketing" {...field} />
                        </FormControl>
                         <FormDescription>Tên này chỉ dùng để bạn quản lý.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormItem>
                      <FormLabel>Tệp Hình ảnh</FormLabel>
                      <FormControl>
                        <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                      </FormControl>
                      <FormDescription>Tải lên hình ảnh sẽ được trả về (thường là pixel 1x1).</FormDescription>
                      <FormMessage />
                    </FormItem>
                    {previewUrl && (
                        <div className="space-y-2">
                            <FormLabel>Xem trước</FormLabel>
                            <div className="rounded-md bg-muted overflow-hidden border p-2 flex justify-center items-center">
                               <img src={previewUrl} alt="Xem trước ảnh" width={50} height={50} style={{ objectFit: 'contain' }} />
                            </div>
                        </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={adding || saving}>
                       {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                       {adding ? 'Đang thêm...' : 'Thêm IP Logger'}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách IP Logger đã tạo</CardTitle>
                <CardDescription>Sao chép URL và chèn vào thẻ &lt;img&gt; để bắt đầu ghi lại IP.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? <p>Đang tải danh sách...</p> : (
                  links.length > 0 ? (
                    links.map(link => (
                      <Card key={link.id} className="flex flex-col sm:flex-row items-center gap-4 p-4">
                        <div className="relative w-20 h-20 sm:w-12 sm:h-12 shrink-0 bg-muted rounded-md flex items-center justify-center border p-1">
                            <Image 
                                src={link.imageUrl} 
                                alt={link.title} 
                                layout="fill" 
                                objectFit="contain" 
                                className="rounded-sm"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{link.title}</p>
                          <p className="text-xs text-muted-foreground truncate">Trả về ảnh từ: {link.imageUrl}</p>
                          <div className="mt-2 flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                            <Eye className="h-3 w-3 text-muted-foreground shrink-0"/>
                            <p className="text-xs font-code text-muted-foreground truncate">/api/pixel/{link.id}.png</p>
                          </div>
                        </div>
                        <div className="flex gap-2 self-start sm:self-center shrink-0">
                          <Button size="sm" variant="outline" onClick={() => handleCopy(link.id)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(link.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Chưa có IP logger nào được tạo.</p>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
