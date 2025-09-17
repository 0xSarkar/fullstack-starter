import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from 'sonner';

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

  useEffect(() => {
    if (!window.google || initialized || !divRef.current) return;

    if (computedWidth === null) {
      const containerWidth = divRef.current.clientWidth;
      setComputedWidth(containerWidth);
      return;
    }

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
        width: Math.min(computedWidth || 400, 400),
      });
      setInitialized(true);
    } catch (err) {
      // Fail silently; user can still use email/password
      // console.error('Google init error', err);
    }
  }, [initialized, googleLogin, onSuccessNavigate, redirectPath, size, shape, text, width, computedWidth]);

  return <div ref={divRef} className='w-full' />;
}
