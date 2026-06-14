"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Login
    </Button>
  );
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      setError(null);
      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
      });

      if (result?.error) {
        setError("Invalid username or password");
        toast.error("Login Failed", {
          description: "Invalid username or password. Please try again.",
        });
      } else {
        toast.success("Login Successful", {
          description: "Welcome back! Redirecting to dashboard...",
        });
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      toast.error("Error", {
        description: "An unexpected error occurred. Please try again.",
      });
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form action={handleLogin} className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Login to your account</h1>
          <p className="text-sm text-balance text-zinc-500 dark:text-zinc-400">
            Enter your credentials below to login to your account
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" placeholder="admin" required />
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
          </div>
          <div className="relative">
            <Input 
              id="password" 
              name="password" 
              type={showPassword ? "text" : "password"} 
              required 
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </div>
        )}

        <SubmitButton />
      </form>
    </div>
  )
}
