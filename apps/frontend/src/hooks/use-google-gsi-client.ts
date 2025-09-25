import { useEffect, useState } from 'react';

const GOOGLE_GSI_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_GSI_SCRIPT_ID = 'google-identity-services';

type LoaderStatus = 'idle' | 'loading' | 'ready' | 'error';

type LoaderState = {
  status: LoaderStatus;
  error: Error | null;
};

const state: LoaderState = {
  status: typeof window !== 'undefined' && window.google?.accounts?.id ? 'ready' : 'idle',
  error: null,
};

let loadPromise: Promise<void> | null = null;

function waitForGoogle(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    let attempts = 0;
    const maxAttempts = 40;
    const interval = 50;

    const check = () => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        reject(new Error('Google Identity Services script loaded but client is unavailable.'));
        return;
      }

      window.setTimeout(check, interval);
    };

    check();
  });
}

function loadGoogleGsiScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (state.status === 'ready') {
    return Promise.resolve();
  }

  if (loadPromise) {
    return loadPromise;
  }

  state.status = 'loading';

  loadPromise = new Promise((resolve, reject) => {
    const complete = () => {
      waitForGoogle()
        .then(() => {
          state.status = 'ready';
          state.error = null;
          resolve();
        })
        .catch(err => {
          state.status = 'error';
          state.error = err;
          loadPromise = null;
          reject(err);
        });
    };

    const fail = () => {
      const error = new Error('Failed to load Google Identity Services script.');
      state.status = 'error';
      state.error = error;
      loadPromise = null;
      reject(error);
    };

    const existingScript = document.getElementById(GOOGLE_GSI_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      const scriptStatus = existingScript.getAttribute('data-status');
      if (scriptStatus === 'loaded') {
        complete();
        return;
      }
      if (scriptStatus === 'error') {
        fail();
        return;
      }

      existingScript.addEventListener('load', complete, { once: true });
      existingScript.addEventListener('error', fail, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_GSI_SCRIPT_ID;
    script.src = GOOGLE_GSI_SRC;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-status', 'loading');

    script.addEventListener(
      'load',
      () => {
        script.setAttribute('data-status', 'loaded');
        complete();
      },
      { once: true }
    );

    script.addEventListener(
      'error',
      () => {
        script.setAttribute('data-status', 'error');
        fail();
      },
      { once: true }
    );

    document.head.appendChild(script);
  });

  return loadPromise;
}

export function preloadGoogleGsiClient(): void {
  if (typeof window === 'undefined') {
    return;
  }
  loadGoogleGsiScript().catch(() => {
    // Swallow here; components will handle error state via hook state.
  });
}

export function useGoogleGsiClient() {
  const [status, setStatus] = useState<LoaderStatus>(() => state.status);
  const [error, setError] = useState<Error | null>(() => state.error);

  useEffect(() => {
    let cancelled = false;

    if (state.status === 'ready') {
      setStatus('ready');
      setError(null);
      return;
    }

    setStatus(prev => (prev === 'ready' ? prev : 'loading'));

    loadGoogleGsiScript()
      .then(() => {
        if (!cancelled) {
          setStatus('ready');
          setError(null);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setStatus('error');
          setError(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    status,
    error,
    isReady: status === 'ready',
    isError: status === 'error',
  } as const;
}
