
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
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { getCloakedLinksAction, saveCloakedLinksAction, type CloakedLinkConfig } from "@/app/actions/cloaked-links"
import { uploadFileAction } from "@/app/actions/upload"
import { Copy, PlusCircle, Save, Trash2, Package, Loader2 } from "lucide-react"
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { getCurrentUserAction } from "@/app/actions/users"

const formSchema = z.object({
  redirectUrl: z.string().url("URL đích phải là một URL hợp lệ."),
  title: z.string().min(1, "Tiêu đề là bắt buộc."),
  description: z.string().optional(),
  // imageUrl is now handled by file upload, so it's not in the form schema for validation
})

export default function CloakerPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [links, setLinks] = React.useState<CloakedLinkConfig[]>([])
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
        if (!user || (!user.permissions.includes('admin') && !user.permissions.includes('link_cloaker'))) {
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
      const existingLinks = await getCloakedLinksAction()
      setLinks(existingLinks)
      setLoading(false)
    }
    loadLinks()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      redirectUrl: "https://www.google.com",
      title: "Tiêu đề trang web",
      description: "Mô tả ngắn gọn về trang web của bạn",
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
            description: "Vui lòng chọn một tệp hình ảnh để tải lên.",
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

    const newLink: CloakedLinkConfig = {
      id: crypto.randomUUID(),
      description: values.description || "",
      redirectUrl: values.redirectUrl,
      title: values.title,
      imageUrl: uploadResult.url
    }
    setLinks(prevLinks => [...prevLinks, newLink])
    toast({
      title: "Đã thêm liên kết mới",
      description: "Đừng quên nhấn 'Lưu thay đổi' để áp dụng.",
    })
    
    // Reset form and file state
    form.reset();
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    setImageFile(null);
    setPreviewUrl(null);
    setAdding(false);
  }

  const handleDelete = (id: string) => {
    setLinks(prevLinks => prevLinks.filter(link => link.id !== id))
    toast({
        title: "Đã xóa liên kết",
        description: "Thay đổi sẽ được áp dụng sau khi bạn lưu.",
        variant: "destructive"
    })
  }
  
  const handleCopy = (id: string) => {
    const url = `${origin}/r/${id}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Đã sao chép!",
      description: "URL bọc đã được sao chép vào bộ nhớ tạm.",
    })
  }
  
  const handleSave = async () => {
    setSaving(true);
    const result = await saveCloakedLinksAction(links);
    if (result.success) {
      toast({
        title: "Thành công",
        description: result.message,
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
          <h1 className="text-xl font-bold font-headline">Link Bọc (Cloaker)</h1>
          <div className="ml-auto">
            <Button onClick={handleSave} disabled={saving || adding}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <CardHeader>
                    <CardTitle>Tạo Liên Kết Mới</CardTitle>
                    <CardDescription>
                      Tạo link xem trước tùy chỉnh. Khi người dùng truy cập, hệ thống sẽ ghi lại IP/vị trí trước khi chuyển hướng đến URL đích.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="redirectUrl" render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Đích</FormLabel>
                        <FormControl>
                          <Input placeholder="https://google.com" {...field} />
                        </FormControl>
                        <FormDescription>Link mà người dùng sẽ được chuyển đến.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiêu đề (og:title)</FormLabel>
                        <FormControl>
                          <Input placeholder="Tiêu đề trang..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả (og:description)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Mô tả trang..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormItem>
                      <FormLabel>Hình ảnh (og:image)</FormLabel>
                      <FormControl>
                        <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                      </FormControl>
                      <FormDescription>Tải lên một hình ảnh để làm ảnh xem trước.</FormDescription>
                      <FormMessage />
                    </FormItem>
                    {previewUrl && (
                        <div className="space-y-2">
                            <FormLabel>Xem trước ảnh</FormLabel>
                            <div className="relative w-full aspect-[1.91/1] rounded-md bg-muted overflow-hidden border">
                               <img src={previewUrl} alt="Xem trước ảnh" className="w-full h-full object-cover" />
                            </div>
                        </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={adding || saving}>
                      {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                      {adding ? 'Đang thêm...' : 'Thêm Liên Kết'}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách liên kết đã tạo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? <p>Đang tải...</p> : (
                  links.length > 0 ? (
                    links.map(link => (
                      <Card key={link.id} className="flex flex-col sm:flex-row items-start gap-4 p-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="relative w-full sm:w-32 h-32 sm:h-20 shrink-0 cursor-pointer group">
                               <Image src={link.imageUrl} alt={link.title} layout="fill" objectFit="cover" className="rounded-md bg-muted transition-transform duration-300 group-hover:scale-105" />
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl p-0 bg-transparent border-0">
                            <DialogHeader className="sr-only">
                                <DialogTitle>{link.title}</DialogTitle>
                                <DialogDescription>{link.description}</DialogDescription>
                            </DialogHeader>
                            <img src={link.imageUrl} alt={link.title} className="rounded-md w-full h-auto" />
                          </DialogContent>
                        </Dialog>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{link.title}</p>
                          <p className="text-xs text-muted-foreground truncate">Đích: {link.redirectUrl}</p>
                          <div className="mt-2 flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                            <Package className="h-3 w-3 text-muted-foreground shrink-0"/>
                            <p className="text-xs font-code text-muted-foreground truncate">/r/{link.id}</p>
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
                    <p className="text-sm text-muted-foreground text-center py-8">Chưa có liên kết nào.</p>
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
