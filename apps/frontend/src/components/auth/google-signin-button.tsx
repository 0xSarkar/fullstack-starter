import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';
import { useGoogleGsiClient } from '@/hooks/use-google-gsi-client';
import { Skeleton } from '@/components/ui/skeleton';

interface GoogleSignInButtonProps {
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  size?: 'large' | 'medium' | 'small';
  width?: number;
  onSuccessNavigate?: (path?: string) => Promise<void> | void;
  redirectPath?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export function GoogleSignInButton({
  text = 'signin_with',
  shape = 'rectangular',
  size = 'large',
  width,
  onSuccessNavigate,
  redirectPath,
}: GoogleSignInButtonProps) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [computedWidth, setComputedWidth] = useState<number | null>(null);
  const googleLogin = useAuthStore(s => s.googleLogin);
  const { isReady, isError } = useGoogleGsiClient();

  useEffect(() => {
    if (typeof width === 'number') {
      setComputedWidth(width);
      return;
    }

    if (!divRef.current) {
      return;
    }

    const measuredWidth = divRef.current.clientWidth;
    if (measuredWidth && measuredWidth !== computedWidth) {
      setComputedWidth(measuredWidth);
    }
  }, [width, computedWidth]);

  useEffect(() => {
    if (!isReady || initialized || !divRef.current) return;

    const targetWidth = Math.min(
      width ?? computedWidth ?? divRef.current.clientWidth ?? 400,
      400
    );

    try {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (resp: any) => {
          if (!resp?.credential) {
            toast.error('Google login failed');
            return;
          }
          try {
            await googleLogin(resp.credential);
            if (onSuccessNavigate) {
              await onSuccessNavigate(redirectPath);
            }
          } catch (err: any) {
            toast.error(err?.message || 'Google login failed');
          }
        },
        auto_select: false,
        ux_mode: 'popup'
      });

      window.google.accounts.id.renderButton(divRef.current, {
        theme: 'outline',
        size,
        text,
        shape,
        width: targetWidth,
      });
      setInitialized(true);
    } catch (err) {
      // Fail silently; user can still use email/password
      // console.error('Google init error', err);
    }
  }, [initialized, googleLogin, onSuccessNavigate, redirectPath, size, shape, text, width, computedWidth, isReady]);

  if (isError) {
    return (
      <div className='w-full rounded-md border border-dashed px-4 py-3 text-center text-sm text-muted-foreground'>
        Google sign-in is temporarily unavailable.
      </div>
    );
  }

  const skeletonHeight = size === 'small' ? 32 : size === 'medium' ? 40 : 48;

  return (
    <div className='relative w-full'>
      {!isReady && (
        <Skeleton className='w-full' style={{ height: skeletonHeight }} />
      )}
      <div
        ref={divRef}
        className={`w-full ${!isReady ? 'opacity-0 pointer-events-none' : ''}`}
      />
    </div>
  );
}
