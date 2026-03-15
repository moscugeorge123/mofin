import * as React from "react"

import { NavMain } from "@workspace/ui/components/nav-main"
import { NavUser } from "@workspace/ui/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@workspace/ui/components/sidebar"
import { LayoutDashboardIcon, ReceiptIcon, WalletIcon } from "lucide-react"

interface User {
  name: string
  email: string
  avatar?: string
}

export function AppSidebar({
  currentPath,
  user,
  onLogout,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  currentPath?: string
  user?: User | null
  onLogout?: () => void
}) {
  const data = {
    user: {
      name: user?.name || "Guest",
      email: user?.email || "",
      avatar: user?.avatar || "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/",
        icon: <LayoutDashboardIcon />,
        isActive: currentPath === "/",
      },
      {
        title: "Bank Accounts",
        url: "/bank-accounts",
        icon: <WalletIcon />,
        isActive: currentPath === "/bank-accounts",
      },
      {
        title: "Transactions",
        url: "/transactions",
        icon: <ReceiptIcon />,
        isActive: currentPath === "/transactions",
      },
    ],
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}
