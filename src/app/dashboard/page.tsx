
"use client"

import * as React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Users, FileText } from "lucide-react"
import Link from "next/link"

const stats = [
    { title: "Total Visits", value: "1,204", icon: Users, change: "+12.5%" },
    { title: "Locations Logged", value: "876", icon: FileText, change: "+8.1%" },
    { title: "Unique IPs", value: "652", icon: BarChart, change: "-2.3%" }
]

export default function DashboardPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-xl font-bold font-headline">Dashboard</h1>
        </header>

        <main className="flex-1 p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                        {stat.title}
                        </CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">
                        {stat.change} from last month
                        </p>
                    </CardContent>
                    </Card>
                ))}
            </div>
            <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome to the Admin Console</CardTitle>
                        <CardDescription>All systems operational.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Use the sidebar to navigate to the <Link href="/admin" className="text-primary underline">Access Logs</Link> to view detailed visitor information.
                            The scraper tools are also available for data collection tasks.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
