import { Outlet } from '@tanstack/react-router';
import { AppSidebar } from '@/layouts/app-layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DeleteNoteConfirmDialog } from '@/components/notes/delete-note-dialog';
import { RenameNoteDialog } from '@/components/notes/rename-note-dialog';

export function AppLayout() {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>

      <DeleteNoteConfirmDialog />
      <RenameNoteDialog />
    </>
  );
}
