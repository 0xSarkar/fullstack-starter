"use client";

import {
  Edit,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { notesQueryOptions } from "@/data/queries/notes-queries";
import type { NoteData } from "@fullstack-starter/shared-schemas";

export function NavNotes() {
  const { isMobile, setOpenMobile } = useSidebar();
  const navigate = useNavigate();

  const { data: notesData } = useSuspenseQuery(notesQueryOptions);

  const openDeleteDialog = (note: NoteData) => {
    navigate({ to: '.', search: (prev) => ({ ...prev, deleteNoteId: note.id }) });
  };

  const openEditDialog = (note: NoteData) => {
    navigate({ to: '.', search: (prev) => ({ ...prev, renameNoteId: note.id }) });
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Notes</SidebarGroupLabel>
      <SidebarMenu>
        {notesData.data.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <span className="text-muted-foreground">No notes yet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          notesData.data.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild>
                <Link to="/notes/$noteId" params={{ noteId: item.id }} onClick={() => { setOpenMobile(false); }} className="[&.active]:bg-sidebar-accent [&.active]:font-medium [&.active]:text-sidebar-accent-foreground">
                  <span className={!item.title ? "text-muted-foreground" : ""}>{item.title ? item.title : "Untitled Note"}</span>
                </Link>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-40"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem onClick={() => openEditDialog(item)}>
                    <Edit className="text-muted-foreground" />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openDeleteDialog(item)}>
                    <Trash2 className="text-muted-foreground" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
