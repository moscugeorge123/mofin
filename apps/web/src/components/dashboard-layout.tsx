import { AppSidebar } from "@workspace/ui/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { useLogout } from "../hooks/use-auth"
import { useUser } from "../hooks/use-user"

export type BreadcrumbItem = {
  label: string
  href?: string
  isCurrentPage?: boolean
}

interface DashboardLayoutProps {
  currentPath: string
  breadcrumbItems: Array<BreadcrumbItem>
  children: React.ReactNode
}

export function DashboardLayout({
  currentPath,
  breadcrumbItems,
  children,
}: DashboardLayoutProps) {
  const user = useUser()
  const logout = useLogout()
  const sidebarUser = user
    ? {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        avatar: "/avatars/shadcn.jpg",
      }
    : null

  const handleLogout = () => {
    logout.mutate()
  }

  return (
    <TooltipProvider>
      <SidebarProvider className="h-screen">
        <AppSidebar
          currentPath={currentPath}
          user={sidebarUser}
          onLogout={handleLogout}
        />
        <SidebarInset className="flex flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, index) => (
                  <div key={index} className="contents">
                    <BreadcrumbItem className="hidden md:block">
                      {item.isCurrentPage ? (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={item.href}>
                          {item.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbItems.length - 1 && (
                      <BreadcrumbSeparator className="hidden md:block" />
                    )}
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
