import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import type { AuthStoreState } from '@/stores/auth-store';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';

interface MyRouterContext {
  auth: AuthStoreState;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster richColors theme='light' />
      <Outlet />
    </ThemeProvider>
  ),
});
