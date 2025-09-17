import { useCallback, useState } from 'react';

interface UseMutationOptions<TData, TError, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
}

interface UseMutationReturn<TData, TError, TVariables> {
  mutate: (variables: TVariables) => Promise<void>;
  isLoading: boolean;
  error: TError | null;
  data: TData | null;
}

export function useMutation<TData = unknown, TError = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables>
): UseMutationReturn<TData, TError, TVariables> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TError | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      setData(result);
      options?.onSuccess?.(result, variables);
    } catch (err) {
      const error = err as TError;
      setError(error);
      setData(null);
      options?.onError?.(error, variables);
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, options]);

  return { mutate, isLoading, error, data };
}
