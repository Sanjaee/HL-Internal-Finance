"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={async () => {
        toast.success("Logged out successfully", {
          description: "You have been securely signed out.",
        });
        await signOut({ redirect: false });
        router.push("/auth/login");
        router.refresh();
      }}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  );
}
