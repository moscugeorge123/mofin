import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import { Loader2 } from "lucide-react"

export function NavMain({
  items,
}: {
  items: Array<{
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    isLoading?: boolean
    customTooltip?: string
  }>
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.customTooltip || item.title}
                isActive={item.isActive}
                asChild
              >
                <a href={item.url}>
                  {item.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    item.icon
                  )}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
