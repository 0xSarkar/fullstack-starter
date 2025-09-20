import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { Outlet, createRootRoute } from '@tanstack/react-router';


export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster richColors theme='light' />
      <Outlet />
    </ThemeProvider>
  ),
});
