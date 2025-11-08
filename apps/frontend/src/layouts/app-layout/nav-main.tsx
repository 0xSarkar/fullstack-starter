import { PencilLine, LoaderCircle, type LucideIcon, Search } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "../../components/ui/button";
import { Link } from "@tanstack/react-router";
import { useCreateNoteMutation } from '@/data/mutations/notes-mutations';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  const { setOpenMobile } = useSidebar();

  const createNoteMutation = useCreateNoteMutation();

  const handleCreateNote = async () => {
    setOpenMobile(false);
    await createNoteMutation.mutateAsync({ title: 'New Note', content: '' });
  };
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="mb-1">
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Create New Note"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              onClick={() => handleCreateNote()}
              disabled={createNoteMutation.isPending}
            >
              {createNoteMutation.isPending ? <LoaderCircle className='animate-spin' /> : <PencilLine />}
              <span>New Note</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <Search />
              <span className="sr-only">Search</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <Link to={item.url}
                  activeOptions={{ exact: true }}
                  onClick={() => setOpenMobile(false)}
                  className="[&.active]:bg-sidebar-accent [&.active]:font-medium [&.active]:text-sidebar-accent-foreground">
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>

    </SidebarGroup>
  );
}
