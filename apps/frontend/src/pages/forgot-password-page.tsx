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
import { Link, useRouter } from "@tanstack/react-router";
import { authApi } from "@/api/auth-api";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

interface ForgotPasswordFormData {
  email: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <LoaderCircle className="animate-spin" />} Send reset link
    </Button>
  );
}

export function ForgotPasswordPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<Partial<ForgotPasswordFormData>>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const email = formData.get('email') as string;

      // Basic validation
      const newErrors: Partial<ForgotPasswordFormData> = {};
      if (!email) newErrors.email = "Email is required";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({}); // Clear errors

      try {
        await authApi.forgotPassword({ email });
        // Success - show toast and redirect to login
        toast.success("Password reset link sent! Check your email.");
        await router.navigate({ to: "/login" });
      } catch (err: any) {
        // Handle field-specific validation errors from API
        if (err.details?.errors) {
          const fieldErrors: Partial<ForgotPasswordFormData> = {};
          err.details.errors.forEach((error: { field: string; message: string; }) => {
            if (error.field === 'email') {
              fieldErrors.email = error.message;
            }
          });
          setErrors(fieldErrors);
        } else {
          // General error - show toast
          toast.error(err.message || "Failed to send reset link. Please try again.");
        }
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
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
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link to="/login" className="underline underline-offset-4">
          Log in
        </Link>
      </div>
    </div>
  );
}
