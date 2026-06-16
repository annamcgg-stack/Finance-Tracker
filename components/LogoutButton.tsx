"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Field";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    router.replace("/welcome");
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} className={className}>
      <LogOut className="h-4 w-4" /> Log out
    </Button>
  );
}
