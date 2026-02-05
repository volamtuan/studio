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
import { Copy, PlusCircle, Save, Trash2, Binary } from "lucide-react"
import { useRouter } from "next/navigation"
import { getCurrentUserAction } from "@/app/actions/users"

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc."),
  imageUrl: z.string().url("Phải là một URL hình ảnh hợp lệ."),
})

export default function PixelTrackerPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [links, setLinks] = React.useState<PixelLinkConfig[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [origin, setOrigin] = React.useState("")

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
      title: "Pixel theo dõi mới",
      imageUrl: "https://via.placeholder.com/1", // Default to a 1x1 pixel
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newLink: PixelLinkConfig = {
      id: crypto.randomUUID(),
      ...values
    }
    setLinks(prevLinks => [...prevLinks, newLink])
    toast({
      title: "Đã thêm pixel mới",
      description: "Đừng quên nhấn 'Lưu thay đổi' để áp dụng.",
    })
    form.reset({
      title: "Pixel theo dõi mới",
      imageUrl: "https://via.placeholder.com/1",
    })
  }

  const handleDelete = (id: string) => {
    setLinks(prevLinks => prevLinks.filter(link => link.id !== id))
    toast({
        title: "Đã xóa pixel",
        description: "Thay đổi sẽ được áp dụng sau khi bạn lưu.",
        variant: "destructive"
    })
  }
  
  const handleCopy = (id: string) => {
    const url = `${origin}/api/pixel/${id}.png`
    navigator.clipboard.writeText(url)
    toast({
      title: "Đã sao chép!",
      description: "URL pixel theo dõi đã được sao chép vào bộ nhớ tạm.",
    })
  }
  
  const handleSave = async () => {
    setSaving(true);
    const result = await savePixelLinksAction(links);
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
          
          <h1 className="text-xl font-bold font-headline">Tạo Pixel Theo dõi</h1>
          <div className="ml-auto">
            <Button onClick={handleSave} disabled={saving}>
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
                    <CardTitle>Tạo Pixel Mới</CardTitle>
                    <CardDescription>
                      Tạo một URL trả về hình ảnh để theo dõi lượt xem (vd: trong email).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên gợi nhớ</FormLabel>
                        <FormControl>
                          <Input placeholder="Vd: Pixel cho email marketing" {...field} />
                        </FormControl>
                         <FormDescription>Tên này chỉ dùng để bạn quản lý.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="imageUrl" render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Hình ảnh</FormLabel>
                        <FormControl>
                          <Input placeholder="https://via.placeholder.com/1" {...field} />
                        </FormControl>
                        <FormDescription>URL của hình ảnh sẽ được trả về (thường là pixel 1x1).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">
                       <PlusCircle className="mr-2 h-4 w-4" /> Thêm Pixel
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Danh sách pixel đã tạo</CardTitle>
                <CardDescription>Sao chép URL và chèn vào thẻ &lt;img&gt; để bắt đầu theo dõi.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? <p>Đang tải danh sách...</p> : (
                  links.length > 0 ? (
                    links.map(link => (
                      <Card key={link.id} className="flex flex-col sm:flex-row items-start gap-4 p-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{link.title}</p>
                          <p className="text-xs text-muted-foreground truncate">Trả về ảnh từ: {link.imageUrl}</p>
                          <div className="mt-2 flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                            <Binary className="h-3 w-3 text-muted-foreground shrink-0"/>
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
                    <p className="text-sm text-muted-foreground text-center py-8">Chưa có pixel nào được tạo.</p>
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
