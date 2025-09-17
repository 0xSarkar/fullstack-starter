import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

import './styles.css';
import reportWebVitals from './reportWebVitals.ts';
// Auth store based approach replaces context provider
import { useAuthStore } from '@/stores/auth-store';
import { client } from '@/lib/api-client';
import { toast } from 'sonner';

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { auth: undefined as any },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const auth = useAuthStore();
  return <RouterProvider router={router} context={{ auth }} />;
}

// Render the app
const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  // Register global 401 handler once
  client.onUnauthorized(() => {
    const state = useAuthStore.getState();
    // Avoid loops if already unauthenticated
    if (state.status === 'authenticated') {
      state.setFrom401();
      // Preserve current location for potential redirect after login
      const path = window.location.pathname + window.location.search;
      toast.error('Session expired. Please log in again.');
      router.navigate({ to: '/login', search: { redirect: path } }).catch(() => { });
    }
  });

  // Kick off bootstrap early (fire-and-forget)
  void useAuthStore.getState().bootstrap();

  root.render(
    <StrictMode>
      <InnerApp />
    </StrictMode>,
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
