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
import { Link, useRouter, useSearch } from "@tanstack/react-router";
import { authApi } from "@/api/auth-api";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <LoaderCircle className="animate-spin" />} Reset password
    </Button>
  );
}

export function ResetPasswordPage() {
  const router = useRouter();
  const search = useSearch({ from: '/_authLayout/reset-password' }) as { token?: string; };
  const [errors, setErrors] = useState<Partial<ResetPasswordFormData>>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const newPassword = formData.get('newPassword') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      // Basic validation
      const newErrors: Partial<ResetPasswordFormData> = {};
      if (!newPassword) newErrors.newPassword = "New password is required";
      if (newPassword && newPassword.length < 5) newErrors.newPassword = "Password must be at least 5 characters";
      if (!confirmPassword) newErrors.confirmPassword = "Please confirm your new password";
      if (confirmPassword && newPassword !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      if (!search.token) {
        toast.error("Invalid reset link. Please request a new password reset.");
        return;
      }

      setErrors({}); // Clear errors

      try {
        await authApi.resetPassword({
          token: search.token,
          newPassword,
          confirmPassword
        });
        // Success - show toast and redirect to login
        toast.success("Password reset successfully! You can now log in with your new password.");
        await router.navigate({ to: "/login" });
      } catch (err: any) {
        // Handle field-specific validation errors from API
        if (err.details?.errors) {
          const fieldErrors: Partial<ResetPasswordFormData> = {};
          err.details.errors.forEach((error: { field: string; message: string; }) => {
            if (error.field === 'newPassword' || error.field === 'confirmPassword') {
              fieldErrors[error.field as keyof ResetPasswordFormData] = error.message;
            }
          });
          setErrors(fieldErrors);
        } else {
          // General error - show toast
          toast.error(err.message || "Failed to reset password. Please try again.");
        }
      }
    });
  };

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  name="newPassword"
                  aria-invalid={!!errors.newPassword}
                />
                {errors.newPassword && (
                  <p className="text-sm text-destructive -mt-1" role="alert">
                    {errors.newPassword}
                  </p>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive -mt-1" role="alert">
                    {errors.confirmPassword}
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
