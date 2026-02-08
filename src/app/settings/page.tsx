
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { getVerificationConfigAction, updateVerificationConfigAction, type VerificationConfig } from "@/app/actions/settings"
import { uploadFileAction } from "@/app/actions/upload"
import { Bot, Save, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { getCurrentUserAction } from "@/app/actions/users"
import Image from "next/image"

const formSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc."),
  description: z.string().min(1, "Mô tả là bắt buộc."),
  fileName: z.string().min(1, "Tên tệp là bắt buộc."),
  fileInfo: z.string().min(1, "Thông tin tệp là bắt buộc."),
  buttonText: z.string().min(1, "Văn bản nút là bắt buộc."),
  footerText: z.string().min(1, "Văn bản chân trang là bắt buộc."),
  redirectUrl: z.string().url("Phải là một URL hợp lệ."),
  // This field will be handled by the file upload logic, but we still need it in the schema to pass to the server action
  previewImageUrl: z.string().url("Phải là một URL hình ảnh hợp lệ."),
  telegramNotificationsEnabled: z.boolean().default(false),
  telegramBotToken: z.string().optional(),
  telegramChatId: z.string().optional(),
})

export default function SettingsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = React.useState(true);
  
  // State for file upload
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>(""); 

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  React.useEffect(() => {
    async function loadSettings() {
      setLoading(true)
      try {
        const config = await getVerificationConfigAction()
        form.reset(config)
        setPreviewUrl(config.previewImageUrl);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải cài đặt.",
        })
      }
      setLoading(false)
    }
    loadSettings()
  }, [form, toast])
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        form.clearErrors("previewImageUrl"); // Clear validation error if user uploads a file
    }
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    let finalValues = { ...values };

    if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadResult = await uploadFileAction(formData);

        if (!uploadResult.success) {
            toast({
                variant: "destructive",
                title: "Lỗi tải lên hình ảnh",
                description: uploadResult.message,
            });
            setLoading(false);
            return;
        }
        finalValues.previewImageUrl = uploadResult.url;
    }

    const result = await updateVerificationConfigAction(finalValues)
    if (result.success) {
      toast({
        title: "Thành công",
        description: result.message,
      })
      form.reset(finalValues)
      setImageFile(null);
      setPreviewUrl(finalValues.previewImageUrl);
    } else {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: result.message,
      })
    }
    setLoading(false)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Cài Đặt Trang Xác Minh</h1>
        </header>
        <main className="flex-1 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Tùy Chỉnh Giao Diện</CardTitle>
                  <CardDescription>
                    Thay đổi văn bản và liên kết được hiển thị trên trang xác minh công khai.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading && !form.formState.isDirty ? (
                    <div className="text-center text-muted-foreground">Đang tải cài đặt...</div>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tiêu Đề Chính</FormLabel>
                            <FormControl>
                              <Input placeholder="Xác minh để tiếp tục" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Văn Bản Mô Tả</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Để bảo vệ tệp và ngăn chặn truy cập trái phép..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="fileName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tên Tệp</FormLabel>
                              <FormControl>
                                <Input placeholder="Tai-lieu-quan-trong.pdf" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fileInfo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Thông Tin Tệp</FormLabel>
                              <FormControl>
                                <Input placeholder="1.2 MB - Tệp an toàn" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="buttonText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Văn Bản Nút</FormLabel>
                            <FormControl>
                              <Input placeholder="Xác minh & Tải xuống" {...field} />
                            </FormControl>
                            <FormDescription>Lưu ý: Văn bản này chỉ hiển thị nếu quy trình xác minh không tự động.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="footerText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Văn Bản Chân Trang</FormLabel>
                            <FormControl>
                              <Input placeholder="Thông tin vị trí của bạn..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="redirectUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL Chuyển Hướng</FormLabel>
                            <FormControl>
                              <Input placeholder="https://www.facebook.com" {...field} />
                            </FormControl>
                            <FormDescription>URL mà người dùng được chuyển đến sau khi xác minh.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormItem>
                          <FormLabel>Hình Ảnh Xem Trước</FormLabel>
                          <FormControl>
                            <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                          </FormControl>
                          <FormDescription>
                            Tải lên hình ảnh mới để thay thế ảnh xem trước khi chia sẻ link.
                          </FormDescription>
                          <FormMessage />
                       </FormItem>
                       {previewUrl && (
                          <div className="space-y-2">
                              <FormLabel>Xem trước</FormLabel>
                              <div className="relative w-24 h-24 rounded-md bg-muted overflow-hidden border">
                                  <img src={previewUrl} alt="Xem trước ảnh" className="w-full h-full object-cover" />
                              </div>
                          </div>
                       )}

                       <Separator className="my-8" />
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-lg font-medium flex items-center gap-2">
                              <Bot className="h-5 w-5 text-primary" />
                              Thông báo Telegram
                          </h3>
                          <p className="text-sm text-muted-foreground">
                              Nhận thông báo tức thì qua Telegram mỗi khi có lượt truy cập mới.
                          </p>
                        </div>
                        <FormField
                          control={form.control}
                          name="telegramNotificationsEnabled"
                          render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                  <div className="space-y-0.5">
                                      <FormLabel className="text-base">
                                          Bật thông báo
                                      </FormLabel>
                                      <FormDescription>
                                          Gửi thông báo cho mỗi lượt truy cập tới bot Telegram.
                                      </FormDescription>
                                  </div>
                                  <FormControl>
                                      <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                      />
                                  </FormControl>
                              </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                              control={form.control}
                              name="telegramBotToken"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Bot Token</FormLabel>
                                      <FormControl>
                                          <Input placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" {...field} />
                                      </FormControl>
                                      <FormDescription>Lấy từ BotFather trên Telegram.</FormDescription>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <FormField
                              control={form.control}
                              name="telegramChatId"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>Chat ID</FormLabel>
                                      <FormControl>
                                          <Input placeholder="ID của bạn hoặc kênh" {...field} />
                                      </FormControl>
                                      <FormDescription>ID của người dùng, group, hoặc channel.</FormDescription>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit" disabled={loading || !form.formState.isDirty}>
                    {loading && form.formState.isDirty ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {loading && form.formState.isDirty ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

    