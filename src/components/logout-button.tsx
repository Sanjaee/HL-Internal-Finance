"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={async () => {
        await signOut({ redirect: false });
        window.location.href = "/auth/login";
      }}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  );
}
