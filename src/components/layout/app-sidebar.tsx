"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  LogOut,
  Zap,
  FileKey2,
  Settings
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const mainNav = [
  {
    title: "Tổng Quan",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Nhật Ký Truy Cập",
    url: "/admin",
    icon: FileKey2,
  },
  {
    title: "Cài Đặt",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isVerified, setIsVerified] = React.useState(false)

  React.useEffect(() => {
    try {
      const isAuthenticated = sessionStorage.getItem('isAuthenticated')
      if (isAuthenticated === 'true') {
        setIsVerified(true)
      } else {
        router.replace('/login')
      }
    } catch (error) {
      router.replace('/login')
    }
  }, [router])

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    sessionStorage.removeItem('isAuthenticated')
    router.push('/login')
  }

  if (!isVerified) {
    // Return null or a skeleton loader to prevent rendering the sidebar
    // and its content before authentication check is complete.
    return null
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="border-b border-border/50 py-4">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-headline font-bold text-lg group-data-[collapsible=icon]:hidden">
            Trang Quản Trị
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Phân Tích</SidebarGroupLabel>
          <SidebarMenu>
            {mainNav.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className="hover:text-accent transition-colors"
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
      </SidebarContent>
      <SidebarFooter className="border-t border-border/50 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="text-muted-foreground hover:text-destructive">
              <a href="/login" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span>Đăng Xuất</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
