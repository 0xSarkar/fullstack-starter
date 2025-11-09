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
import { getFieldErrors } from '@/lib/api-errors';
import { useSignupMutation } from '@/data/mutations/auth-mutations';

interface SignupFormData {
  email: string;
  password: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <LoaderCircle className="animate-spin" />} Sign up
    </Button>
  );
}

export function SignupPage() {
  const router = useRouter();
  const signupMutation = useSignupMutation();
  const { redirect } = useSearch({ from: '/_authLayout/signup' });
  const [errors, setErrors] = useState<Partial<SignupFormData>>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const emailEntry = formData.get('email');
      const passwordEntry = formData.get('password');
      const email = typeof emailEntry === 'string' ? emailEntry.trim() : '';
      const password = typeof passwordEntry === 'string' ? passwordEntry : '';

      // Basic validation
      const newErrors: Partial<SignupFormData> = {};
      if (!email) newErrors.email = "Email is required";
      if (!password) newErrors.password = "Password is required";
      if (password && password.length < 5) newErrors.password = "Password must be at least 5 characters";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({}); // Clear errors

      try {
        await signupMutation.mutateAsync({ email, password });
        await router.navigate({ to: "/" });
      } catch (err: unknown) {
        // Handle field-specific validation errors from API
        const fieldErrorsList = getFieldErrors(err);
        if (fieldErrorsList.length > 0) {
          const fieldErrors: Partial<SignupFormData> = {};
          fieldErrorsList.forEach((error) => {
            if (error.field === 'email' || error.field === 'password') {
              fieldErrors[error.field] = error.message;
            }
          });
          setErrors(fieldErrors);
        } else {
          // General error - show toast
          const message = err instanceof Error ? err.message : "Signup failed. Please try again.";
          toast.error(message);
        }
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            Sign up with your Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <GoogleSignInButton
                  text="signup_with"
                  redirectPath={redirect}
                  onSuccessNavigate={async (dest) => {
                    const target = dest && !['/login', '/signup', '/forgot-password', '/reset-password'].includes(dest)
                      ? dest
                      : '/';
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
                  <Label htmlFor="password">Password</Label>
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
                Already have an account?{" "}
                <Link to="/login" className="underline underline-offset-4">
                  Log in
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
