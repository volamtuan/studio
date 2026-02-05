
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
import { getIpLinksAction, saveIpLinksAction, type IpLinkConfig } from "@/app/actions/ip-links"
import { Copy, PlusCircle, Save, Trash2, Globe } from "lucide-react"
import { useRouter } from "next/navigation"
import { getCurrentUserAction } from "@/app/actions/users"

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc."),
  redirectUrl: z.string().url("Phải là một URL hợp lệ."),
})

export default function IpLoggerPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [links, setLinks] = React.useState<IpLinkConfig[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [origin, setOrigin] = React.useState("")

  React.useEffect(() => {
    async function checkAuth() {
        const user = await getCurrentUserAction();
        if (!user || (!user.permissions.includes('admin') && !user.permissions.includes('ip_links'))) {
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
      const existingLinks = await getIpLinksAction()
      setLinks(existingLinks)
      setLoading(false)
    }
    loadLinks()
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "Liên kết mới",
      redirectUrl: "https://www.google.com",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newLink: IpLinkConfig = {
      id: crypto.randomUUID(),
      ...values
    }
    setLinks(prevLinks => [...prevLinks, newLink])
    toast({
      title: "Đã thêm liên kết mới",
      description: "Đừng quên nhấn 'Lưu thay đổi' để áp dụng.",
    })
    form.reset({
      title: "Liên kết mới",
      redirectUrl: "https://www.google.com",
    })
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
    const url = `${origin}/l/${id}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Đã sao chép!",
      description: "URL theo dõi IP đã được sao chép vào bộ nhớ tạm.",
    })
  }
  
  const handleSave = async () => {
    setSaving(true);
    const result = await saveIpLinksAction(links);
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
          <h1 className="text-xl font-bold font-headline">Tạo Link Lấy IP</h1>
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
                    <CardTitle>Tạo Liên Kết Mới</CardTitle>
                    <CardDescription>
                      Tạo một liên kết ngắn để ghi lại IP của người truy cập.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên gợi nhớ</FormLabel>
                        <FormControl>
                          <Input placeholder="Vd: Link cho chiến dịch A" {...field} />
                        </FormControl>
                         <FormDescription>Tên này chỉ dùng để bạn quản lý.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="redirectUrl" render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL chuyển hướng</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.google.com" {...field} />
                        </FormControl>
                        <FormDescription>Người dùng sẽ bị chuyển đến link này sau khi truy cập.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full">
                       <PlusCircle className="mr-2 h-4 w-4" /> Thêm Liên Kết
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
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{link.title}</p>
                          <p className="text-xs text-muted-foreground truncate">Chuyển hướng đến: {link.redirectUrl}</p>
                          <div className="mt-2 flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                            <Globe className="h-3 w-3 text-muted-foreground shrink-0"/>
                            <p className="text-xs font-code text-muted-foreground truncate">/l/{link.id}</p>
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
