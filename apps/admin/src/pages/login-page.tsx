
import { useState, startTransition } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearch } from "@tanstack/react-router";
import { useAuthStore } from '@/stores/auth-store';
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

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
  const login = useAuthStore(s => s.login);
  const { redirect } = useSearch({ from: '/_authLayout/login' });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  const getDestination = (redirectPath?: string) => {
    return redirectPath && !['/login', '/signup', '/forgot-password', '/reset-password'].includes(redirectPath) ? redirectPath : '/';
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

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
        await login(email, password);
        const destination = getDestination(redirect);
        await router.navigate({ to: destination });
      } catch (err: any) {
        // Handle field-specific validation errors from API
        if (err.details?.errors) {
          const fieldErrors: Partial<LoginFormData> = {};
          err.details.errors.forEach((error: { field: string; message: string; }) => {
            if (error.field === 'email' || error.field === 'password') {
              fieldErrors[error.field as keyof LoginFormData] = error.message;
            }
          });
          setErrors(fieldErrors);
        } else {
          // General error - show toast
          toast.error(err.message || "Login failed. Please try again.");
        }
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome Admin</CardTitle>
          <CardDescription>
            Login with your Admin credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}