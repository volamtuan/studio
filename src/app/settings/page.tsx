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
import { Save } from "lucide-react"

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  fileName: z.string().min(1, "File name is required."),
  fileInfo: z.string().min(1, "File info is required."),
  buttonText: z.string().min(1, "Button text is required."),
  footerText: z.string().min(1, "Footer text is required."),
  redirectUrl: z.string().url("Must be a valid URL."),
})

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: async () => {
      setLoading(true)
      const config = await getVerificationConfigAction()
      setLoading(false)
      return config
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    const result = await updateVerificationConfigAction(values)
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      })
    } else {
      toast({
        variant: "destructive",
        title: "Error",
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
          <h1 className="text-xl font-bold font-headline">Verification Page Settings</h1>
        </header>
        <main className="flex-1 p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Customize UI</CardTitle>
                  <CardDescription>
                    Change the text and links displayed on the public verification page.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Title</FormLabel>
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
                        <FormLabel>Description Text</FormLabel>
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
                          <FormLabel>File Name</FormLabel>
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
                          <FormLabel>File Info</FormLabel>
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
                        <FormLabel>Button Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Xác minh & Tải xuống" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="footerText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Text</FormLabel>
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
                        <FormLabel>Redirect URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.facebook.com" {...field} />
                        </FormControl>
                        <FormDescription>The URL users are sent to after verification.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit" disabled={loading || !form.formState.isDirty}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
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
