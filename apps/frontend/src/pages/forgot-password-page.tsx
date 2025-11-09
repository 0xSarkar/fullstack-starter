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
import { LoaderCircle } from "lucide-react";
import { getFieldErrors } from '@/lib/api-errors';
import { useForgotPasswordMutation } from '@/data/mutations/auth-mutations';

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
  const forgotPasswordMutation = useForgotPasswordMutation();
  const [errors, setErrors] = useState<Partial<ForgotPasswordFormData>>({});

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const emailEntry = formData.get('email');
      const email = typeof emailEntry === 'string' ? emailEntry.trim() : '';

      // Basic validation
      const newErrors: Partial<ForgotPasswordFormData> = {};
      if (!email) newErrors.email = "Email is required";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({}); // Clear errors

      try {
        await forgotPasswordMutation.mutateAsync({ email });
        await router.navigate({ to: "/login" });
      } catch (err: unknown) {
        // Handle field-specific validation errors from API
        const fieldErrorsList = getFieldErrors(err);
        if (fieldErrorsList.length > 0) {
          const fieldErrors: Partial<ForgotPasswordFormData> = {};
          fieldErrorsList.forEach((error) => {
            if (error.field === 'email') {
              fieldErrors.email = error.message;
            }
          });
          setErrors(fieldErrors);
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
