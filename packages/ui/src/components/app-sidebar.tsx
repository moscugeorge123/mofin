import * as React from "react"

import { NavMain } from "@workspace/ui/components/nav-main"
import { NavUser } from "@workspace/ui/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@workspace/ui/components/sidebar"
import {
  CameraIcon,
  FileTextIcon,
  FoldersIcon,
  LayoutDashboardIcon,
  ReceiptIcon,
  WalletIcon,
} from "lucide-react"

interface User {
  name: string
  email: string
  avatar?: string
}

function prefixPath(basePath: string, path: string) {
  const base = basePath.replace(/\/$/, "")
  if (path === "/") {
    return base ? `${base}/` : "/"
  }
  return `${base}${path}`
}

export function AppSidebar({
  currentPath,
  user,
  onLogout,
  hasProcessingFiles,
  basePath = "/",
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  currentPath?: string
  user?: User | null
  onLogout?: () => void
  hasProcessingFiles?: boolean
  basePath?: string
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
        url: prefixPath(basePath, "/"),
        icon: <LayoutDashboardIcon />,
        isActive: currentPath === "/",
      },
      {
        title: "Bank Accounts",
        url: prefixPath(basePath, "/bank-accounts"),
        icon: <WalletIcon />,
        isActive: currentPath === "/bank-accounts",
      },
      {
        title: "Transactions",
        url: prefixPath(basePath, "/transactions"),
        icon: <ReceiptIcon />,
        isActive: currentPath === "/transactions",
      },
      {
        title: "Groups",
        url: prefixPath(basePath, "/groups"),
        icon: <FoldersIcon />,
        isActive: currentPath === "/groups",
      },
      {
        title: "Snapshots",
        url: prefixPath(basePath, "/snapshots"),
        icon: <CameraIcon />,
        isActive: currentPath === "/snapshots",
      },
    ],
    beforeUserMenu: [
      {
        title: "Files",
        url: prefixPath(basePath, "/files"),
        icon: <FileTextIcon />,
        isActive: currentPath === "/files",
        isLoading: hasProcessingFiles,
        customTooltip: hasProcessingFiles
          ? "Files - Processing files..."
          : "Files",
      },
    ],
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavMain items={data.beforeUserMenu} />
        <NavUser user={data.user} onLogout={onLogout} />
      </SidebarFooter>
    </Sidebar>
  )
}
