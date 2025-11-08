
import { useState, startTransition } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { getFieldErrors } from '@fullstack-starter/shared-api';
import { useLoginMutation } from '@/data/mutations/auth-mutations';

interface LoginFormData {
  email: string;
  password: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <LoaderCircle className="animate-spin" />} Login
    </Button>
  );
}

export function LoginPage() {
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const { redirect } = useSearch({ from: '/_authLayout/login' });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  const getDestination = (redirectPath?: string) => {
    return redirectPath && !['/login', '/signup', '/forgot-password', '/reset-password'].includes(redirectPath) ? redirectPath : '/';
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const emailEntry = formData.get('email');
      const passwordEntry = formData.get('password');
      const email = typeof emailEntry === 'string' ? emailEntry.trim() : '';
      const password = typeof passwordEntry === 'string' ? passwordEntry : '';

      // Basic validation
      const newErrors: Partial<LoginFormData> = {};
      if (!email) newErrors.email = "Email is required";
      if (!password) newErrors.password = "Password is required";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({}); // Clear errors

      try {
        await loginMutation.mutateAsync({ email, password });
        const destination = getDestination(redirect);
        await router.navigate({ to: destination });
      } catch (err: unknown) {
        const fieldErrorsList = getFieldErrors(err);
        if (fieldErrorsList.length > 0) {
          const fieldErrors: Partial<LoginFormData> = {};
          fieldErrorsList.forEach((error) => {
            if (error.field === 'email' || error.field === 'password') {
              fieldErrors[error.field] = error.message;
            }
          });
          setErrors(fieldErrors);
        } else {
          // General error - show toast
          const message = err instanceof Error ? err.message : "Login failed. Please try again.";
          toast.error(message);
        }
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <GoogleSignInButton
                  text="signin_with"
                  redirectPath={redirect}
                  onSuccessNavigate={async (dest) => {
                    const target = getDestination(dest);
                    try {
                      await router.navigate({ to: target });
                    } catch { /* ignore navigation errors */ }
                  }}
                />
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="m@example.com"
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive -mt-1" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive -mt-1" role="alert">
                      {errors.password}
                    </p>
                  )}
                </div>
                <SubmitButton />
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}