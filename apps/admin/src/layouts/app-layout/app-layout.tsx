import { Outlet } from '@tanstack/react-router';
import { AppSidebar } from '@/layouts/app-layout/app-sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export function AppLayout() {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
