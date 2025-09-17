import { Link, Outlet } from '@tanstack/react-router';
import { GalleryVerticalEnd } from 'lucide-react';

export function AuthLayout() {
  return (
    <div>
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <Link to="/" className="flex items-center gap-2 self-center font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Fullstack Starter
          </Link>
          <Outlet />
        </div>
      </div>
    </div>
  );
}