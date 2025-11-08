import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useGoogleGsiClient } from '@/hooks/use-google-gsi-client';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoogleLoginMutation } from '@/data/mutations/auth-mutations';

interface GoogleSignInButtonProps {
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  size?: 'large' | 'medium' | 'small';
  width?: number;
  onSuccessNavigate?: (path?: string) => Promise<void> | void;
  redirectPath?: string;
}

type GoogleCredentialResponse = {
  clientId?: string;
  credential?: string;
  select_by?: string;
};

type GoogleInitializationConfig = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void | Promise<void>;
  auto_select?: boolean;
  ux_mode?: 'popup' | 'redirect';
};

type GoogleButtonConfiguration = {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: GoogleSignInButtonProps['text'];
  shape?: GoogleSignInButtonProps['shape'];
  width?: number;
};

interface GoogleAccountsId {
  initialize(config: GoogleInitializationConfig): void;
  renderButton(parent: HTMLElement, options: GoogleButtonConfiguration): void;
}

interface GoogleIdentityServices {
  accounts: {
    id: GoogleAccountsId;
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
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
  const googleLoginMutation = useGoogleLoginMutation();
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

    const googleIdentity = window.google?.accounts?.id;
    if (!googleIdentity) {
      return;
    }

    try {
      googleIdentity.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (resp: GoogleCredentialResponse) => {
          if (!resp?.credential) {
            toast.error('Google login failed');
            return;
          }
          try {
            await googleLoginMutation.mutateAsync({ credential: resp.credential });
            if (onSuccessNavigate) {
              await onSuccessNavigate(redirectPath);
            }
          } catch (err: unknown) {
            // Error is already handled in the mutation
            console.error('Google login error:', err);
          }
        },
        auto_select: false,
        ux_mode: 'popup'
      });

      googleIdentity.renderButton(divRef.current, {
        theme: 'outline',
        size,
        text,
        shape,
        width: targetWidth,
      });
      setInitialized(true);
    } catch {
      // Fail silently; user can still use email/password
      // console.error('Google init error', err);
    }
  }, [initialized, googleLoginMutation, onSuccessNavigate, redirectPath, size, shape, text, width, computedWidth, isReady]);

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
