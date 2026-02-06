
"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  LogOut,
  Zap,
  FileKey2,
  Settings,
  MapPin,
  Image as ImageIcon,
  Users,
  Link as LinkIcon,
  FilePlus2,
  Binary,
  Package,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { getCurrentUserAction, logoutAction, type SessionPayload, type UserPermission } from "@/app/actions/users"

const analyticsNav = [
  { title: "Tổng Quan", url: "/dashboard", icon: LayoutDashboard, permission: null },
  { title: "Nhật Ký Truy Cập", url: "/admin", icon: FileKey2, permission: "admin" },
];

const creatorNav = [
  { title: "Fake Link Google Map", url: "/fake-link", icon: MapPin, permission: "map_links" },
  { title: "Liên kết Theo dõi Ảnh", url: "/image-logger", icon: ImageIcon, permission: "image_links" },
  { title: "Tạo Link Lấy IP", url: "/ip-logger", icon: LinkIcon, permission: "ip_links" },
  { title: "Tạo File DOCX", url: "/file-creator", icon: FilePlus2, permission: "file_creator" },
  { title: "Link Bọc", url: "/cloaker", icon: Package, permission: "link_cloaker" },
  { title: "Tạo Pixel Theo dõi", url: "/pixel-tracker", icon: Binary, permission: "pixel_tracker" },
];

const adminNav = [
    { title: "Quản lý Người dùng", url: "/users", icon: Users, permission: "admin" },
    { title: "Cài Đặt", url: "/settings", icon: Settings, permission: "admin" },
];

const navGroups = [
  { label: "Phân Tích", items: analyticsNav },
  { label: "Công Cụ Tạo Link", items: creatorNav },
  { label: "Quản Trị Hệ Thống", items: adminNav },
]


export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = React.useState<SessionPayload | null>(null);

  React.useEffect(() => {
    async function fetchUser() {
        const currentUser = await getCurrentUserAction();
        if (currentUser) {
            setUser(currentUser);
        } else {
            router.replace('/login');
        }
    }
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
  }

  const hasPermission = (permission: string | null) => {
    if (!permission) return true; // Public link
    if (!user) return false;
    return user.permissions.includes('admin') || user.permissions.includes(permission as UserPermission);
  }

  if (!user) {
    return null;
  }
  
  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="border-b border-border/50 py-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/10 text-primary">
            <Zap className="h-5 w-5" />
          </div>
          <span className="font-headline font-bold text-lg group-data-[collapsible=icon]:hidden">
            Trang Quản Trị
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex-1">
          {navGroups.map((group) => {
            const availableItems = group.items.filter(item => hasPermission(item.permission));
            if (availableItems.length === 0) return null;

            return (
              <React.Fragment key={group.label}>
                <SidebarGroup>
                  <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">{group.label}</SidebarGroupLabel>
                  <SidebarMenu>
                    {availableItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={pathname === item.url}
                          tooltip={item.title}
                          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                        >
                          <Link href={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              </React.Fragment>
            )
          })}
        </div>
        
        <div className="border-t border-border/50 p-2">
            <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton disabled className="justify-start pointer-events-none">
                    <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground font-bold">
                    {user?.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold">{user?.username}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                    <LogOut className="h-4 w-4" />
                    <span>Đăng Xuất</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
