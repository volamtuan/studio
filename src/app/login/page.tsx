"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Zap, ShieldAlert, ShieldX } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    const username = (e.currentTarget.elements.namedItem("username") as HTMLInputElement)?.value
    const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement)?.value

    // Simulate auth delay
    setTimeout(() => {
      if (username === "vlt" && password === "123") {
        sessionStorage.setItem('isAuthenticated', 'true');
        router.push("/dashboard")
      } else {
          setError("Tên đăng nhập hoặc mật khẩu không hợp lệ.")
          setLoading(false)
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-headline font-bold">Bảng Điều Khiển</h1>
          <p className="text-muted-foreground">Quản Lý Truy Cập</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-2xl">
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>Đăng Nhập</CardTitle>
              <CardDescription>Nhập thông tin để truy cập.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tên đăng nhập</Label>
                <Input id="username" name="username" placeholder="vlt" required className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input id="password" name="password" type="password" placeholder="••••" required className="bg-muted/30" />
              </div>
              
              {error && (
                 <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3 mt-4">
                    <ShieldX className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">
                      {error}
                    </p>
                  </div>
              )}

              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-3 mt-4">
                <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">
                  Nghiêm cấm truy cập trái phép. Mọi địa chỉ IP và nỗ lực đăng nhập đều được ghi lại.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Đang xác thực..." : "Đăng Nhập"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground">
          &copy; 2024 Hệ thống truy cập an toàn. Bảo lưu mọi quyền.
        </p>
      </div>
    </div>
  )
}
