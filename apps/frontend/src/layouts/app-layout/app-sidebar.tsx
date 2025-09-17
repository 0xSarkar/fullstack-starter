import * as React from "react";
import {
  Command,
  MessageCircleMore,
  NotebookPen,
} from "lucide-react";

import { NavMain } from "@/layouts/app-layout/nav-main";
import { NavNotes } from "@/layouts/app-layout/nav-notes";
import { NavUser } from "@/layouts/app-layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Notes",
      url: "/notes",
      icon: NotebookPen,
    },
    {
      title: "Chats",
      url: "/chats",
      icon: MessageCircleMore,
    }
  ]
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/">
                <Command className="!size-5" />
                <span className="text-base font-semibold">Fullstack Starter</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavNotes />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
