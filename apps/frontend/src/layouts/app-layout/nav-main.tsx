import { MessageCirclePlus, PencilLine, LoaderCircle, type LucideIcon } from "lucide-react";

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
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useNotesStore } from '@/stores/notes-store';
import { createNoteApi } from '@fullstack-starter/shared-api';
import { toast } from 'sonner';
import { useState } from 'react';

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
  const navigate = useNavigate();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const setCreatedNote = useNotesStore(state => state.setCreatedNote);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNote = async () => {
    setIsCreating(true);
    try {
      const response = await createNoteApi({ title: 'New Note', content: '' });
      const noteData = { ...response.data, updatedAt: response.data.createdAt };
      setCreatedNote(noteData);
      setOpenMobile(false);
      await navigate({ to: '/notes/$noteId', params: { noteId: response.data.id } });
      router.invalidate();
    } catch (error: any) {
      console.error('Failed to create note:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create note';
      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Create New Note"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              onClick={() => handleCreateNote()}
              disabled={isCreating}
            >
              {isCreating ? <LoaderCircle className='animate-spin' /> : <PencilLine />}
              <span>New Note</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <MessageCirclePlus />
              <span className="sr-only">New Chat</span>
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
