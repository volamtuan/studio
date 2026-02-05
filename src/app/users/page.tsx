
'use client'

import * as React from 'react'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  ShieldCheck,
  KeyRound,
  PlusCircle,
  Save,
  Trash2,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  getUsersAction,
  addUserAction,
  updateAdminPasswordAction,
  deleteUserAction,
} from '@/app/actions/users'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

type User = {
  username: string
  permissions: string[]
}

export default function UsersPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [users, setUsers] = React.useState<User[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const addUserFormRef = React.useRef<HTMLFormElement>(null)
  const changePasswordFormRef = React.useRef<HTMLFormElement>(null)

   // Protect page
  React.useEffect(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (!user.permissions?.includes('admin')) {
        toast({ title: 'Truy cập bị từ chối', description: 'Bạn không có quyền truy cập trang này.', variant: 'destructive' });
        router.replace('/dashboard');
      }
    } catch (e) {
      router.replace('/login');
    }
  }, [router, toast]);

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true)
    const userList = await getUsersAction()
    setUsers(userList)
    setIsLoading(false)
  }, [])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAddUser = async (formData: FormData) => {
    const result = await addUserAction(formData)
    if (result.success) {
      toast({ title: 'Thành công', description: result.message })
      addUserFormRef.current?.reset()
      fetchUsers()
    } else {
      toast({
        title: 'Lỗi',
        description: result.message,
        variant: 'destructive',
      })
    }
  }

  const handleChangePassword = async (formData: FormData) => {
    const result = await updateAdminPasswordAction(formData)
    if (result.success) {
      toast({
        title: 'Thành công',
        description: `${result.message} Vui lòng đăng nhập lại với mật khẩu mới.`,
      })
      setTimeout(() => {
        sessionStorage.removeItem('user')
        router.push('/login')
      }, 2000)
    } else {
      toast({
        title: 'Lỗi',
        description: result.message,
        variant: 'destructive',
      })
    }
    changePasswordFormRef.current?.reset()
  }

  const handleDeleteUser = async (username: string) => {
    if (
      confirm(
        `Bạn có chắc chắn muốn xóa người dùng "${username}" không? Hành động này không thể hoàn tác.`
      )
    ) {
      const result = await deleteUserAction(username)
      if (result.success) {
        toast({ title: 'Thành công', description: result.message })
        fetchUsers()
      } else {
        toast({
          title: 'Lỗi',
          description: result.message,
          variant: 'destructive',
        })
      }
    }
  }

  const permissionLabels: { [key: string]: string } = {
    admin: 'Quản trị viên',
    map_links: 'Tạo Link Map',
    image_links: 'Tạo Link Ảnh',
    ip_links: 'Tạo Link Lấy IP',
    file_creator: 'Tạo File DOCX',
    pixel_tracker: 'Tạo Pixel Theo dõi',
    link_cloaker: 'Tạo Link Bọc',
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="flex items-center gap-2 text-xl font-bold font-headline">
            <Users />
            Quản lý Người dùng
          </h1>
        </header>

        <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck />
                  Thêm Người Dùng Mới
                </CardTitle>
                <CardDescription>
                  Tạo tài khoản mới và cấp quyền truy cập các tính năng.
                </CardDescription>
              </CardHeader>
              <form ref={addUserFormRef} action={handleAddUser}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Tên đăng nhập</Label>
                      <Input
                        id="username"
                        name="username"
                        required
                        placeholder="ví dụ: user01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Mật khẩu</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Quyền truy cập</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border p-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="map_links" name="permissions" value="map_links" />
                        <Label htmlFor="map_links">Tạo Link Google Map</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="image_links"
                          name="permissions"
                          value="image_links"
                        />
                        <Label htmlFor="image_links">Tạo Link Theo dõi Ảnh</Label>
                      </div>
                       <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ip_links"
                          name="permissions"
                          value="ip_links"
                        />
                        <Label htmlFor="ip_links">Tạo Link Lấy IP</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="file_creator"
                          name="permissions"
                          value="file_creator"
                        />
                        <Label htmlFor="file_creator">Tạo File DOCX</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="pixel_tracker"
                          name="permissions"
                          value="pixel_tracker"
                        />
                        <Label htmlFor="pixel_tracker">Tạo Pixel Theo dõi</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="link_cloaker"
                          name="permissions"
                          value="link_cloaker"
                        />
                        <Label htmlFor="link_cloaker">Tạo Link Bọc</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">
                    <PlusCircle className="mr-2" />
                    Tạo Người Dùng
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound />
                  Đổi Mật Khẩu Admin
                </CardTitle>
                <CardDescription>
                  Thay đổi mật khẩu cho tài khoản quản trị viên (vlt).
                </CardDescription>
              </CardHeader>
              <form ref={changePasswordFormRef} action={handleChangePassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input id="newPassword" name="newPassword" type="password" required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" variant="secondary">
                    <Save className="mr-2" />
                    Cập Nhật Mật Khẩu
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Danh sách người dùng</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Quyền</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.username}>
                          <TableCell className="font-medium">
                            {user.username}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.permissions.map((p) => (
                                <Badge
                                  key={p}
                                  variant={
                                    p === 'admin' ? 'default' : 'secondary'
                                  }
                                >
                                  {permissionLabels[p] || p}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {user.username !== 'vlt' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive h-8 w-8"
                                onClick={() => handleDeleteUser(user.username)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
