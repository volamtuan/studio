
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Users,
  ShieldCheck,
  KeyRound,
  PlusCircle,
  Save,
  Trash2,
  Pencil
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  getUsersAction,
  addUserAction,
  updateAdminPasswordAction,
  deleteUserAction,
  updateUserAction,
  type UserPermission,
  getCurrentUserAction
} from '@/app/actions/users'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

type User = {
  username: string
  permissions: UserPermission[]
}

const ALL_PERMISSIONS: Exclude<UserPermission, 'admin'>[] = [
    'map_links', 
    'image_links', 
    'file_creator',
    'link_cloaker',
    'pixel_tracker'
];


const permissionLabels: { [key in UserPermission]: string } = {
  admin: 'Quản trị viên',
  map_links: 'Tạo Link Map',
  image_links: 'Tạo Link Ảnh',
  file_creator: 'Tạo File DOCX',
  link_cloaker: 'Tạo Link Bọc',
  pixel_tracker: 'Tạo IP Logger',
}

export default function UsersPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [users, setUsers] = React.useState<User[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const addUserFormRef = React.useRef<HTMLFormElement>(null)
  const editUserFormRef = React.useRef<HTMLFormElement>(null)
  const changePasswordFormRef = React.useRef<HTMLFormElement>(null)

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

  const handleUpdateUser = async (formData: FormData) => {
    const result = await updateUserAction(formData)
    if (result.success) {
      toast({ title: 'Thành công', description: result.message })
      setEditingUser(null)
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
                      <Label htmlFor="username-add">Tên đăng nhập</Label>
                      <Input
                        id="username-add"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 rounded-lg border p-4">
                      {ALL_PERMISSIONS.map(p => (
                        <div className="flex items-center space-x-2" key={`add-${p}`}>
                          <Checkbox id={`add-${p}`} name="permissions" value={p} />
                          <Label htmlFor={`add-${p}`}>{permissionLabels[p]}</Label>
                        </div>
                      ))}
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
                 <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>Quyền</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-40">
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
                                    className="whitespace-nowrap"
                                    >
                                    {permissionLabels[p] || p}
                                    </Badge>
                                ))}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                {user.username !== 'vlt' && (
                                <div className='flex justify-end gap-1'>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setEditingUser(user)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive h-8 w-8"
                                      onClick={() => handleDeleteUser(user.username)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                )}
                            </TableCell>
                            </TableRow>
                        ))
                        )}
                    </TableBody>
                    </Table>
                     <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Chỉnh sửa quyền cho {editingUser?.username}</DialogTitle>
                            <DialogDescription>Chọn các quyền bạn muốn cấp cho người dùng này.</DialogDescription>
                        </DialogHeader>
                        <form ref={editUserFormRef} action={handleUpdateUser}>
                            <input type="hidden" name="username" value={editingUser?.username || ''} />
                            <div className="grid grid-cols-2 gap-4 py-4">
                                {ALL_PERMISSIONS.map(p => (
                                    <div className="flex items-center space-x-2" key={`edit-${p}`}>
                                        <Checkbox 
                                            id={`edit-${p}`} 
                                            name="permissions" 
                                            value={p} 
                                            defaultChecked={editingUser?.permissions.includes(p)}
                                        />
                                        <Label htmlFor={`edit-${p}`}>{permissionLabels[p]}</Label>
                                    </div>
                                ))}
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Hủy</Button>
                                </DialogClose>
                                <Button type="submit">Lưu thay đổi</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                 </Dialog>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
