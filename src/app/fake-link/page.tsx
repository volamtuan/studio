
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
import { getMapLinksAction, saveMapLinksAction, type MapLinkConfig } from "@/app/actions/map-links"
import { uploadFileAction } from "@/app/actions/upload"
import { Copy, PlusCircle, Save, Trash2, Globe, Loader2 } from "lucide-react"
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
import Image from "next/image"

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc."),
  description: z.string().min(1, "Mô tả là bắt buộc."),
  // imageUrl is now handled by file upload
})

export default function FakeLinkPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [links, setLinks] = React.useState<MapLinkConfig[]>([])
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
        if (!user || (!user.permissions.includes('admin') && !user.permissions.includes('map_links'))) {
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
      const existingLinks = await getMapLinksAction()
      setLinks(existingLinks)
      setLoading(false)
    }
    loadLinks()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "Homestay Long Khánh Quê Em, Bình Lộc, Long Khanh",
      description: "Homestay. Bình Lộc, Long Khanh, Tổ 5 Ấp 4, Xã, Bình Lộc, Long Khánh, Đồng Nai, Vietnam.",
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

    const newLink: MapLinkConfig = {
      id: crypto.randomUUID(),
      title: values.title,
      description: values.description,
      imageUrl: uploadResult.url
    }
    setLinks(prevLinks => [...prevLinks, newLink])
    toast({
      title: "Đã thêm liên kết mới",
      description: "Đừng quên nhấn 'Lưu thay đổi' để áp dụng.",
    })
    
    // Reset form and file state
    form.reset({
        title: "Homestay Long Khánh Quê Em, Bình Lộc, Long Khanh",
        description: "Homestay. Bình Lộc, Long Khanh, Tổ 5 Ấp 4, Xã, Bình Lộc, Long Khánh, Đồng Nai, Vietnam.",
    });
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
    const url = `${origin}/map-preview/${id}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Đã sao chép!",
      description: "URL liên kết đã được sao chép vào bộ nhớ tạm.",
    })
  }
  
  const handleSave = async () => {
    setSaving(true);
    const result = await saveMapLinksAction(links);
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
          <h1 className="text-xl font-bold font-headline">Tạo Link Google Map Giả</h1>
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
                      Điền thông tin để tạo một liên kết xem trước giống Google Maps.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiêu đề (og:title)</FormLabel>
                        <FormControl>
                          <Input placeholder="Homestay Long Khánh..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả (og:description)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Homestay. Bình Lộc..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormItem>
                      <FormLabel>Hình ảnh (og:image)</FormLabel>
                      <FormControl>
                        <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                      </FormControl>
                      <FormDescription>Tải lên ảnh để hiển thị xem trước.</FormDescription>
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
                <CardDescription>Sao chép và gửi liên kết để bắt đầu theo dõi.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? <p>Đang tải danh sách...</p> : (
                  links.length > 0 ? (
                    links.map(link => (
                      <Card key={link.id} className="flex flex-col sm:flex-row items-start gap-4 p-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="relative w-full sm:w-32 h-32 sm:h-20 shrink-0 cursor-pointer group">
                               <img src={link.imageUrl} alt={link.title} className="w-full h-full object-cover rounded-md bg-muted transition-transform duration-300 group-hover:scale-105" />
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl p-0 bg-transparent border-0">
                             <DialogHeader className="sr-only">
                                <DialogTitle>{link.title}</DialogTitle>
                                <DialogDescription>{link.description}</DialogDescription>
                            </DialogHeader>
                            <div className="relative w-full aspect-video">
                                <img src={link.imageUrl} alt={link.title} className="w-full h-full object-contain rounded-md" />
                            </div>
                          </DialogContent>
                        </Dialog>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{link.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{link.description}</p>
                          <div className="mt-2 flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                            <Globe className="h-3 w-3 text-muted-foreground shrink-0"/>
                            <p className="text-xs font-code text-muted-foreground truncate">/map-preview/{link.id}</p>
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
                    <p className="text-sm text-muted-foreground text-center py-8">Chưa có liên kết nào được tạo.</p>
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

    